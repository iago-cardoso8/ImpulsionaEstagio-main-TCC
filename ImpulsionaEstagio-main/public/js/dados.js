"use strict";
let jobs = [];
function savedJobsStorageKey() {
    try {
        const user = JSON.parse(localStorage.getItem('impulsiona_user') || 'null');
        return user?.id ? `ifpb_saved:${user.id}` : 'ifpb_saved:anonymous';
    }
    catch {
        return 'ifpb_saved:anonymous';
    }
}
function readSavedJobs() {
    try {
        const saved = JSON.parse(localStorage.getItem(savedJobsStorageKey()) || '[]');
        return Array.isArray(saved) && saved.every(Number.isInteger) ? saved : [];
    }
    catch {
        return [];
    }
}
let savedJobs = readSavedJobs();
