interface Job {
  id: number;
  title: string;
  company: string;
  email?: string;
  location: string;
  salary: string;
  target: string;
  desc: string;
  requirements: string[] | string;
  benefits: string[] | string;
  type: string;
  time: string;
}

interface Profile {
  name: string;
  email: string;
  course: string;
  campus: string;
  status: string;
  availability: string;
}

interface NotificationItem {
  title: string;
  message: string;
  time: string;
}

interface ApiResponse<T> {
  sucesso: boolean;
  quantidade?: number;
  dados?: T;
  erro?: string;
  mensagem?: string;
}

interface Window {
  __ifCampiByUF?: Record<string, string[]>;
  startJobEdit?: (id: number) => void;
  deleteJob?: (id: number) => void;
}

declare function getElement<T extends HTMLElement>(id: string): T | null;
declare function getInputElement(id: string): HTMLInputElement | null;
declare function getSelectElement(id: string): HTMLSelectElement | null;
declare function getDataListElement(id: string): HTMLDataListElement | null;
declare function getInputValue(id: string): string;
declare function getTextValue(id: string): string;
