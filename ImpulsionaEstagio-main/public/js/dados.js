"use strict";
let jobs = [];
const savedJobsFromStorage = localStorage.getItem("ifpb_saved");
let savedJobs = [];
try {
    savedJobs = savedJobsFromStorage ? JSON.parse(savedJobsFromStorage) : [];
}
catch {
    savedJobs = [];
}
