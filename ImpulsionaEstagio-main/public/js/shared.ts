function getElement<T extends HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
}

function getInputElement(id: string): HTMLInputElement | null {
    return getElement<HTMLInputElement>(id);
}

function getSelectElement(id: string): HTMLSelectElement | null {
    return getElement<HTMLSelectElement>(id);
}

function getDataListElement(id: string): HTMLDataListElement | null {
    return getElement<HTMLDataListElement>(id);
}

function getInputValue(id: string): string {
    return getInputElement(id)?.value.trim() ?? '';
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
