

export interface getContentByIdResponseSuccess {
    conteudoId: number,
    titulo: string,
    ativo: boolean,
    dataInicio: null | string,
    dataFim: null | string,
    posicionamento: string,
    codigoFonte: string,
    termoBusca: string,
    exibeTodasBuscas: boolean,
    naoExibeBuscas: boolean,
    exibeTodosHotsites: boolean,
    hotsitesId: number[]
}

export interface RestErrorResponse {
    resultadoOperacao: boolean,
    mensagem: string,
    codigo: number
}