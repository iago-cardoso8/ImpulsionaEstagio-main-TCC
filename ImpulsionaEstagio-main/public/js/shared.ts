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

function getTextValue(id: string): string {
    return getElement<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(id)?.value.trim() ?? '';
}

declare function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
declare function isAuthenticated(): boolean;
declare function openAuthPanel(register?: boolean): void;
