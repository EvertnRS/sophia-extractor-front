
export const fieldDescriptions: Record<string, string> = {
    tp_parto:
        "Tipo de parto (cesárea ou normal), lido da ficha de internação. Se não encontrado ali, usamos o resumo de alta como reserva.",
    apgar_1min:
        "Nota do Apgar no 1º minuto de vida, lida da ficha de internação (ou do resumo de alta, se estiver ausente).",
    apgar_5min:
        "Nota do Apgar no 5º minuto de vida, lida da ficha de internação (ou do resumo de alta, se estiver ausente).",
    idade_semanal_gestacional:
        "Idade gestacional em semanas, lida diretamente da ficha de internação.",
    raca_cor_materna:
        "Cor/raça da mãe, lida da ficha da sala de parto.",
    idade_materna:
        "Idade da mãe, extraída da ficha da sala de parto.",
    gestacao_multipla:
        "Indica se a gestação foi múltipla (gemelar), conforme marcado na ficha de admissão neonatal.",
    sexo:
        "Sexo do recém-nascido, lido da ficha de internação (ou do resumo de alta, se ausente).",
    drogas_gest:
        "Indica se houve uso de drogas durante a gestação, conforme marcado na ficha da sala de parto.",
    fumante:
        "Indica se a mãe é fumante, conforme marcado na ficha da sala de parto.",
    freq_bebida:
        "Indica se há consumo de álcool pela mãe, conforme marcado na ficha da sala de parto.",
    has_materna:
        "Indica se a mãe tem hipertensão, conforme marcado na ficha da sala de parto.",
    qt_consultas:
        "Número de consultas de pré-natal, lido diretamente da ficha da sala de parto.",
    tempo_escolaridade:
        "Grau de escolaridade da mãe, lido como texto livre da ficha da sala de parto.",
    tp_clampeamento_cordao:
        "Tipo de clampeamento do cordão umbilical (imediato ou tardio), conforme marcado na ficha de internação.",
    bolsa_rota:
        "Tempo de bolsa rota, lido da ficha de internação (ou do resumo de alta, se ausente).",
    sulfato_magnesio:
        "Indica se a mãe recebeu sulfato de magnésio, conforme marcado na ficha de internação.",
    esteroide_anteneonatal:
        "Indica se houve uso de corticoide antenatal, conforme marcado na ficha de internação (ou no resumo de alta, se ausente).",
    trat_sifilis_conge:
        "Indica se a mãe é reagente para sífilis, conforme o resultado do exame registrado na ficha de internação.",
    dnv:
        "Número da Declaração de Nascido Vivo, lido diretamente da ficha da sala de parto.",
    vl_perimetro_cefalico:
        "Perímetro cefálico do bebê, lido da ficha de admissão neonatal (ou do resumo de alta, se ausente).",
    ventilacao_mascara_balao:
        "Indica se foi usada ventilação com máscara e balão durante a reanimação, conforme marcado na ficha de manobras de reanimação.",
    droga_reanimacao:
        "Indica se foram usadas drogas durante a reanimação, conforme marcado na ficha de manobras de reanimação.",
    uso_o2:
        "Indica se foi usado oxigênio com máscara durante a reanimação, conforme marcado na ficha de manobras de reanimação.",
    massagem_cardiaca:
        "Indica se houve massagem cardíaca durante a reanimação, conforme marcado na ficha de manobras de reanimação (ou no resumo de alta, se ausente).",
    ventilacao_ventilador_manual_peca_t:
        "Indica se foi usado ventilador manual (peça T) durante a reanimação, conforme marcado na ficha de manobras de reanimação.",
    ventilacao_canula_traqueal:
        "Indica se foi feita intubação (tubo orotraqueal) durante a reanimação, conforme marcado na ficha de manobras de reanimação.",
    reanimacao_neonatal:
        "Indica se houve algum procedimento de reanimação (massagem, ventilação, drogas ou intubação), calculado a partir dos itens marcados na ficha de manobras de reanimação.",
    cpap_nasal_sala_parto:
        "Indica se foi usado CPAP nasal ainda na sala de parto, conforme marcado na ficha de manobras de reanimação.",
    o2_pos_reanimacao:
        "Indica se o bebê recebeu oxigênio acima da concentração do ar ambiente após a reanimação, calculado a partir do percentual de oxigênio registrado.",
    md_evitar_hipotermia:
        "Indica se alguma medida para evitar hipotermia (saco plástico, touca ou CPAP precoce) foi usada, combinando os itens marcados e menções no texto.",
    usou_saco_plastico_hipotermia:
        "Indica se foi usado saco plástico para evitar hipotermia, combinando o item marcado na ficha com qualquer menção ao termo no texto da internação.",
    usou_touca_hipotermia:
        "Indica se foi usada touca para evitar hipotermia, combinando o item marcado na ficha com qualquer menção ao termo no texto da internação.",
    usou_colchao_termico_hipotermia:
        "Indica se foi usado colchão térmico. Não existe um campo específico no formulário; procuramos por menções ao termo no texto das evoluções médicas.",
    temp_medida_admissao:
        "Temperatura registrada no momento da admissão, buscada nas evoluções que mencionam explicitamente 'admissão'.",
    temp_admissao:
        "Temperatura de admissão. Ainda não identificada nos documentos analisados.",
    vent_mecanica:
        "Indica se o bebê precisou de ventilação mecânica em algum momento, verificado em todas as páginas de evolução médica.",
    cpap_nasal:
        "Indica se o bebê usou CPAP nasal em algum momento, verificado em todas as páginas de evolução médica.",
    cpap_nasal_sem_vent_mecanica:
        "Indica se o bebê usou CPAP nasal sem nunca precisar de ventilação mecânica, calculado a partir dos dois campos acima.",
    vent_mecanica_dias:
        "Número de dias em ventilação mecânica, calculado pelo intervalo entre o primeiro e o último registro em que ela aparece marcada.",
    vent_mecanica_36_semanas:
        "Indica se o bebê ainda estava em ventilação mecânica perto das 36 semanas de idade corrigida, verificado no registro mais próximo dessa idade.",
    o2_dia_28:
        "Indica se o bebê ainda usava algum suporte de oxigênio no 28º dia de vida, verificado no registro com essa data exata.",
    o2_36_semanas:
        "Indica se o bebê ainda usava algum suporte de oxigênio perto das 36 semanas de idade corrigida, verificado no registro mais próximo dessa idade.",
    tempo_o2_dias:
        "Duração em dias do uso de oxigênio suplementar, extraída apenas quando o texto menciona esse tempo de forma explícita (ex.: 'ficou em O2 por 5 dias').",
    sdr:
        "Diagnóstico de Síndrome do Desconforto Respiratório (SDR), identificado por menções ao termo (ou à Doença da Membrana Hialina) no texto das evoluções, desconsiderando hipóteses descartadas ou apenas cogitadas.",
    ttrn:
        "Diagnóstico de Taquipneia Transitória do Recém-Nascido, confirmado por menções explícitas ao termo no texto das evoluções.",
    hipertensao_pulmonar:
        "Diagnóstico de hipertensão pulmonar, confirmado por menção ao termo normalmente associada a um exame de ecocardiograma.",
    hemorragia_pulmonar:
        "Diagnóstico de hemorragia pulmonar, confirmado por menção explícita ao termo no texto das evoluções.",
    pneumonia_adquirida:
        "Diagnóstico de pneumonia adquirida durante a internação, confirmado por menção ao termo com achado clínico ou radiológico associado.",
    pneumonia_congenita:
        "Diagnóstico de pneumonia presente desde o nascimento, confirmado por menção explícita ao termo.",
    pneumonia_vent_mecanica:
        "Diagnóstico de pneumonia associada ao uso do ventilador mecânico, confirmado por menção explícita ao termo.",
    pneumotorax_vent_mecanica:
        "Diagnóstico de pneumotórax, geralmente confirmado por radiografia, identificado por menção ao termo no texto das evoluções.",
    anomalias_pulmonares:
        "Malformação pulmonar estrutural/congênita, identificada por menção ao termo no texto das evoluções.",
    extubacao_acidental:
        "Indica se houve uma extubação acidental (não planejada), identificada por menção ao termo no texto das evoluções.",
    convulsao_dia_3:
        "Indica se houve uma convulsão descrita por volta do 3º dia de vida, identificada por menção ao termo no texto das evoluções.",
    hr_vida_primeira_dose_surfactante:
        "Horas de vida na primeira dose de surfactante, extraídas do texto quando aparece a expressão '[número] horas de vida'.",
    surfactante:
        "Indica se o bebê recebeu surfactante, combinando o item marcado na ficha de reanimação com qualquer menção ao termo no texto das evoluções.",
    epicutaneo:
        "Indica se foi usado cateter epicutâneo (via central), verificado em todas as páginas de nutrição parenteral.",
    tempo_epicutaneo:
        "Tempo de uso do cateter epicutâneo em dias, extraído preferencialmente de uma menção explícita no resumo de alta (ex.: 'PICC 5 dias'); sem essa menção, é calculado pelo intervalo entre os registros com o acesso marcado.",
    cateter_umbilical_venoso:
        "Indica se foi usado cateter umbilical venoso, verificado em todas as páginas de evolução médica (ou por menção no resumo de alta).",
    tempo_cateter_umbilical_venoso:
        "Tempo de uso do cateter umbilical venoso em dias, extraído preferencialmente de uma menção explícita no resumo de alta; sem essa menção, é calculado pelo intervalo entre os registros com o cateter marcado.",
    cateter_umbilical_arterial:
        "Indica se foi usado especificamente um cateter umbilical arterial (via arterial, diferente do venoso mais comum), identificado por menção explícita ao termo.",
    tempo_cateter_umbilical_arterial:
        "Momento de inserção/retirada do cateter umbilical arterial, extraído apenas quando há menção explícita no texto.",
    disseccao_venosa:
        "Indica se foi realizada uma dissecção venosa (procedimento cirúrgico para acesso venoso), identificada por menção explícita ao termo -- não considera dificuldades comuns de acesso periférico ou indicação de PICC.",
    tempo_disseccao_venosa:
        "Momento em que a dissecção venosa foi realizada, extraído apenas quando há menção explícita no texto.",
    parenteral_plena:
        "Indica se o bebê recebeu nutrição parenteral plena, verificado em todas as páginas de evolução médica.",
    tempo_parenteral:
        "Tempo total em nutrição parenteral, somando os períodos registrados nas páginas de nutrição parenteral e complementando com intervalos mencionados no resumo de alta que ainda não tenham sido contados.",
    uso_soro_aminoacido:
        "Indica se houve uso de aminoácidos na nutrição parenteral, verificado em todas as páginas com esse registro.",
    drogas_vasoativas:
        "Nome das drogas vasoativas usadas, mantendo a descrição mais completa encontrada entre os registros de reavaliação.",
    enteral:
        "Indica se o bebê recebeu dieta enteral (por sonda), verificado em todas as páginas de evolução médica.",
    tp_primeira_enteral:
        "Data da primeira dieta enteral, identificada pelo registro mais antigo em que ela aparece marcada.",
    peso:
        "Peso do bebê, lido da ficha de nutrição parenteral (ou do resumo de alta, se ausente).",
    sepse:
        "Diagnóstico de sepse, confirmado por menção explícita ao termo no texto das evoluções -- não considera apenas risco ou vigilância por prematuridade.",
    infeccao_precoce:
        "Infecção neonatal precoce (até 72h de vida), confirmada por menção explícita ao termo -- fatores de risco maternos isolados não contam.",
    infeccao_tardia:
        "Infecção neonatal tardia (após 72h de vida), confirmada por menção explícita ao termo -- vigilância de rotina isolada não conta.",
    antibiotico_sepse:
        "Esquema de antibióticos usado para tratar sepse, extraído apenas quando mencionado explicitamente no texto.",
    hemocultura_precoce:
        "Indica se foi feita hemocultura precoce, identificada apenas quando o texto traz exatamente essa expressão.",
    hemocultura_tardia:
        "Indica se foi feita hemocultura tardia, identificada apenas quando o texto traz exatamente essa expressão.",
    infeccao_cateter:
        "Indica se houve infecção relacionada a cateter, identificada quando o texto menciona 'infecção' próximo à palavra 'cateter'.",
    ecn:
        "Diagnóstico de enterocolite necrosante, confirmado por menção explícita, geralmente associada a sinais como distensão abdominal, sangue nas fezes ou pneumatose.",
    cirurgia_ecn:
        "Indica se houve cirurgia por enterocolite necrosante, confirmada por menção explícita a um procedimento (laparotomia, drenagem).",
    cirurgia_anomalia_congenita:
        "Indica se houve cirurgia para corrigir uma anomalia congênita estrutural, confirmada por menção explícita ao procedimento.",
    anomalias_cardiacas:
        "Anomalia cardíaca, identificada por menção no campo de condições de nascimento da ficha de internação.",
    hemorragia_intracraniana:
        "Hemorragia intracraniana, identificada por menção no campo de condições de nascimento da ficha de internação.",
    anomalia_sistema_nervoso_central:
        "Anomalia do sistema nervoso central, identificada pelo item marcado no exame físico da sala de parto (ou por menção explícita no resumo de alta).",
    anomalia_gastrintestinais:
        "Malformação gastrintestinal estrutural (como atresia ou gastrosquise), identificada por menção explícita -- distensão abdominal isolada ou dieta suspensa não contam.",
    anomalias_geniturinarias:
        "Malformação geniturinária estrutural (como agenesia renal ou hidronefrose), identificada por menção explícita ao termo.",
    anomalia_cromossomica:
        "Anomalia ou síndrome cromossômica (como Down ou trissomias), confirmada ou fortemente suspeita por menção explícita com características associadas.",
    outros_desfechos_congenitos:
        "Indica se houve alguma outra malformação registrada no exame físico da sala de parto.",
    qual_defeito_congenito:
        "Descrição da anomalia congênita encontrada, priorizando o texto já registrado nos itens marcados no exame físico e, na ausência dele, uma busca por menções no texto das evoluções.",
    exame_rop:
        "Indica se foi realizado o exame de mapeamento de retina para retinopatia da prematuridade (ROP) -- não conta o teste do olhinho, que é uma triagem diferente.",
    grau_rop:
        "Grau da retinopatia da prematuridade, extraído apenas quando o texto traz explicitamente a palavra 'grau' associada a um número perto de 'ROP'.",
    cirurgia_rop:
        "Indica se houve tratamento cirúrgico (a laser ou anti-VEGF) para ROP, confirmado por menção explícita ao procedimento.",
    desfecho:
        "Desfecho da internação (por exemplo, alta hospitalar), verificado no registro mais recente entre as páginas de procedimentos.",
    metodo_canguru:
        "Indica se o bebê foi colocado em método canguru em algum momento, verificado em todas as páginas de procedimentos.",
    dias_vida_metodo_canguru:
        "Dias de vida no início do método canguru, calculado pela diferença entre a data de nascimento e o primeiro registro em que o método aparece marcado.",
};

/** Remove acentos e normaliza para minúsculas, pra casar variações como "cordão"/"cordao". */
export function normalizeFieldKey(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

/**
 * Retorna a descrição amigável de como um campo é extraído, ou `null` se
 * não houver descrição cadastrada para ele. Aceita tanto o path completo
 * (ex.: "dados.tp_parto") quanto só o nome do campo.
 */
export function getFieldDescription(path: string): string | null {
    const lastSegment = path.split(".").pop() ?? path;
    const key = normalizeFieldKey(lastSegment);

    return fieldDescriptions[key] ?? null;
}