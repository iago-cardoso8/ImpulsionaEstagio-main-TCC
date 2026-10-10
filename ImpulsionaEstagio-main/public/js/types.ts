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
  usuarioId?: number | null;
  createdAt?: string | Date;
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

interface ApplicationItem {
  id: number;
  status: string;
  appliedAt: string;
  vaga: Job;
  usuario?: { name: string; email: string };
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
}
