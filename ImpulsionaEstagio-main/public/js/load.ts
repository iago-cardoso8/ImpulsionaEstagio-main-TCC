async function loadJobById(id: number): Promise<Job | null> {
    try {
        const response = await fetch(`/api/vagas/${id}`);

        if (!response.ok) {
            throw new Error(`Vaga não encontrada: ${response.status}`);
        }

        const resultado = await response.json() as ApiResponse<Job>;

        if (resultado.sucesso && resultado.dados) {
            console.log(`✅ Vaga ${id} carregada com sucesso`);
            return resultado.dados;
        }
        return null;
    } catch (erro) {
        console.error(`❌ Erro ao carregar vaga ${id}:`, erro);
        return null;
    }
}
