/**
 * Simulador local do Backblaze B2 (API compatível com S3).
 * Implementa apenas o que a API do organizador usa: criar bucket, enviar, baixar (com Range),
 * consultar e remover objetos. Sem dependências: roda com `node b2-local/server.mjs`.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const PORT = Number(process.env.B2_LOCAL_PORT ?? 9000);
const DATA_DIR = path.resolve(process.env.B2_LOCAL_DATA ?? "b2-local/data");
const KEY_ID = process.env.B2_KEY_ID ?? "local-key-id";
const BUCKETS = (process.env.B2_LOCAL_BUCKETS ?? process.env.B2_BUCKET ?? "organizador-estudos")
    .split(",").map((name) => name.trim()).filter(Boolean);

fs.mkdirSync(DATA_DIR, { recursive: true });
BUCKETS.forEach((bucket) => fs.mkdirSync(path.join(DATA_DIR, bucket), { recursive: true }));

const xml = (body) => `<?xml version="1.0" encoding="UTF-8"?>${body}`;

const sendError = (res, status, code, message) => {
    res.writeHead(status, { "Content-Type": "application/xml" });
    res.end(xml(`<Error><Code>${code}</Code><Message>${message}</Message></Error>`));
};

const bucketDir = (bucket) => path.join(DATA_DIR, bucket);

const objectPath = (bucket, key) => {
    const root = bucketDir(bucket);
    const target = path.resolve(root, key);
    if (!target.startsWith(root + path.sep)) return null;
    return target;
};

const metaPath = (file) => `${file}.meta.json`;

const readBody = (req) => new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
});

// corpo "aws-chunked": <tamanho hex>[;chunk-signature=...]\r\n<dados>\r\n ... 0\r\n<trailers>
const decodeAwsChunked = (buffer) => {
    const parts = [];
    let offset = 0;

    while (offset < buffer.length) {
        const lineEnd = buffer.indexOf("\r\n", offset);
        if (lineEnd === -1) break;

        const size = parseInt(buffer.subarray(offset, lineEnd).toString().split(";")[0], 16);
        if (!size) break;

        const start = lineEnd + 2;
        parts.push(buffer.subarray(start, start + size));
        offset = start + size + 2;
    }

    return Buffer.concat(parts);
};

// o simulador não valida a assinatura, apenas confere o keyId, como forma de simular as credenciais
const isAuthorized = (req, url) => {
    const header = req.headers.authorization ?? "";
    const credential = /Credential=([^/]+)\//.exec(header)?.[1] ?? url.searchParams.get("X-Amz-Credential")?.split("/")[0];
    return credential === KEY_ID;
};

const listObjects = (bucket) => {
    const root = bucketDir(bucket);
    const result = [];

    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (!entry.name.endsWith(".meta.json")) {
                const stat = fs.statSync(full);
                result.push({ key: path.relative(root, full).split(path.sep).join("/"), size: stat.size, modified: stat.mtime });
            }
        }
    };

    walk(root);
    return result;
};

const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);

// página simples para acompanhar os arquivos durante a demonstração
const renderConsole = (res) => {
    const buckets = fs.readdirSync(DATA_DIR, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);

    const sections = buckets.map((bucket) => {
        const objects = listObjects(bucket);
        const rows = objects.map((item) => `<tr><td>${escapeHtml(item.key)}</td><td>${item.size.toLocaleString("pt-BR")} bytes</td><td>${item.modified.toLocaleString("pt-BR")}</td></tr>`).join("");
        return `<h2>${escapeHtml(bucket)} <small>(${objects.length} objeto(s))</small></h2>
<table><thead><tr><th>Chave</th><th>Tamanho</th><th>Modificado</th></tr></thead><tbody>${rows || '<tr><td colspan="3">Vazio</td></tr>'}</tbody></table>`;
    }).join("");

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>B2 local</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#222}table{border-collapse:collapse;width:100%;margin-bottom:24px}td,th{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left;font-size:14px}small{color:#777;font-weight:normal}</style>
</head><body><h1>Simulador local do Backblaze B2</h1><p>Pasta de dados: <code>${escapeHtml(DATA_DIR)}</code></p>${sections || "<p>Nenhum bucket.</p>"}</body></html>`);
};

const handleObject = async (req, res, bucket, key) => {
    const file = objectPath(bucket, key);
    if (!file) return sendError(res, 400, "InvalidArgument", "Chave inválida");

    if (req.method === "PUT") {
        let body = await readBody(req);
        const encoding = req.headers["content-encoding"] ?? "";
        const sha = req.headers["x-amz-content-sha256"] ?? "";
        if (encoding.includes("aws-chunked") || sha.startsWith("STREAMING-")) body = decodeAwsChunked(body);

        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, body);
        fs.writeFileSync(metaPath(file), JSON.stringify({ contentType: req.headers["content-type"] ?? "application/octet-stream" }));

        const etag = `"${crypto.createHash("md5").update(body).digest("hex")}"`;
        res.writeHead(200, { ETag: etag });
        return res.end();
    }

    if (req.method === "DELETE") {
        fs.rmSync(file, { force: true });
        fs.rmSync(metaPath(file), { force: true });
        res.writeHead(204);
        return res.end();
    }

    if (req.method !== "GET" && req.method !== "HEAD") return sendError(res, 405, "MethodNotAllowed", "Método não suportado");

    if (!fs.existsSync(file)) return sendError(res, 404, "NoSuchKey", "O objeto não existe");

    const size = fs.statSync(file).size;
    const meta = fs.existsSync(metaPath(file)) ? JSON.parse(fs.readFileSync(metaPath(file), "utf8")) : {};
    const headers = { "Content-Type": meta.contentType ?? "application/octet-stream", "Accept-Ranges": "bytes" };

    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
    let start = 0;
    let end = size - 1;
    let status = 200;

    if (range && size > 0) {
        if (range[1]) {
            start = Number(range[1]);
            end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
        } else {
            start = Math.max(0, size - Number(range[2]));
        }

        if (start > end) {
            res.writeHead(416, { "Content-Range": `bytes */${size}` });
            return res.end();
        }

        status = 206;
        headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
    }

    headers["Content-Length"] = size === 0 ? 0 : end - start + 1;
    res.writeHead(status, headers);

    if (req.method === "HEAD" || size === 0) return res.end();

    fs.createReadStream(file, { start, end }).pipe(res);
};

const handleBucket = (req, res, bucket, url) => {
    const dir = bucketDir(bucket);

    if (req.method === "PUT") {
        fs.mkdirSync(dir, { recursive: true });
        res.writeHead(200);
        return res.end();
    }

    if (!fs.existsSync(dir)) return sendError(res, 404, "NoSuchBucket", "O bucket não existe");

    if (req.method === "HEAD") {
        res.writeHead(200);
        return res.end();
    }

    if (req.method === "GET") {
        const prefix = url.searchParams.get("prefix") ?? "";
        const contents = listObjects(bucket)
            .filter((item) => item.key.startsWith(prefix))
            .map((item) => `<Contents><Key>${escapeHtml(item.key)}</Key><Size>${item.size}</Size><LastModified>${item.modified.toISOString()}</LastModified></Contents>`)
            .join("");

        res.writeHead(200, { "Content-Type": "application/xml" });
        return res.end(xml(`<ListBucketResult><Name>${bucket}</Name><Prefix>${escapeHtml(prefix)}</Prefix><IsTruncated>false</IsTruncated>${contents}</ListBucketResult>`));
    }

    return sendError(res, 405, "MethodNotAllowed", "Método não suportado");
};

const server = http.createServer(async (req, res) => {
    try {
        const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

        if (url.pathname === "/" && req.method === "GET" && !req.headers.authorization) return renderConsole(res);

        if (!isAuthorized(req, url)) return sendError(res, 403, "InvalidAccessKeyId", "Chave de acesso inválida");

        const [bucket, ...keyParts] = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
        if (!bucket) return sendError(res, 400, "InvalidBucketName", "Bucket não informado");

        if (keyParts.length === 0) return handleBucket(req, res, bucket, url);

        if (!fs.existsSync(bucketDir(bucket))) return sendError(res, 404, "NoSuchBucket", "O bucket não existe");

        return await handleObject(req, res, bucket, keyParts.join("/"));
    } catch (err) {
        console.error(err);
        if (!res.headersSent) sendError(res, 500, "InternalError", "Erro interno do simulador");
        else res.destroy();
    }
});

server.listen(PORT, () => {
    console.log(`Simulador do B2 em http://localhost:${PORT} (buckets: ${BUCKETS.join(", ")})`);
    console.log(`Arquivos salvos em ${DATA_DIR}`);
});
