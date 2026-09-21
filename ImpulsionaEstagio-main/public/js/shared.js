"use strict";
function getElement(id) {
    return document.getElementById(id);
}
function getInputElement(id) {
    return getElement(id);
}
function getSelectElement(id) {
    return getElement(id);
}
function getDataListElement(id) {
    return getElement(id);
}
function getInputValue(id) {
    return getInputElement(id)?.value.trim() ?? '';
}
function getTextValue(id) {
    return getElement(id)?.value.trim() ?? '';
}
