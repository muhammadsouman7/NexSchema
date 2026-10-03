export function downloadFile(filename, content, mime = "text/plain;charset=utf-8") {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadMany(files, delay = 600) {
    for (const [name, content] of Object.entries(files)) {
        downloadFile(name, content);
        await new Promise((r) => setTimeout(r, delay));
    }
}