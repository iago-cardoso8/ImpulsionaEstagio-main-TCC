let jobs: Job[] = [];

function savedJobsStorageKey(): string {
    try {
        const user = JSON.parse(localStorage.getItem('impulsiona_user') || 'null') as { id?: number } | null;
        return user?.id ? `ifpb_saved:${user.id}` : 'ifpb_saved:anonymous';
    } catch {
        return 'ifpb_saved:anonymous';
    }
}

function readSavedJobs(): number[] {
    try {
        const saved = JSON.parse(localStorage.getItem(savedJobsStorageKey()) || '[]');
        return Array.isArray(saved) && saved.every(Number.isInteger) ? saved : [];
    } catch {
        return [];
    }
}

let savedJobs: number[] = readSavedJobs();
