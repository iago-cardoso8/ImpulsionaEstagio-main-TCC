let jobs: Job[] = [];

const savedJobsFromStorage = localStorage.getItem("ifpb_saved");
let savedJobs: number[] = [];

try {
    savedJobs = savedJobsFromStorage ? JSON.parse(savedJobsFromStorage) : [];
} catch {
    savedJobs = [];
}
