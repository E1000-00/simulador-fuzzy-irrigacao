# Simulador Fuzzy Mamdani - Irrigação de Jardim

Universidade Federal do Piauí (UFPI)
Disciplina: Inteligência Artificial - 2026.2
Atividade Prática sobre Sistemas Fuzzy

## Alunos

- Eric Albuquerque Silva
- Lucio Vitor Santos da Penha
- Francisco Eduardo Mesquita Cruz

## Links

- Aplicação (GitHub Pages): https://e1000-00.github.io/simulador-fuzzy-irrigacao/
- Repositório: https://github.com/E1000-00/simulador-fuzzy-irrigacao

## Sobre o trabalho

A gente fez um simulador de sistema fuzzy Mamdani que diz quanto tempo (em minutos) um jardim deve ser irrigado, dependendo da umidade do solo (0 a 100%) e da temperatura (10 a 40 °C). A saída vai de 0 a 30 minutos.

Tudo roda no navegador, só com HTML, CSS e JavaScript. A parte da inferência (fuzzificação, regras, implicação, agregação e defuzzificação) foi implementada por nós, sem biblioteca de fuzzy.

Os valores de pertinência aparecem como grau de compatibilidade com cada termo (seco, baixa, curto etc.), não como probabilidade. Por isso eles não precisam somar 1.

## Como o Mamdani foi feito

1. **Fuzzificação**: calcula os 3 graus de pertinência da umidade e os 3 da temperatura.
2. **Avaliação das regras**: o E é o mínimo, então h(r) = min(μumidade, μtemperatura).
3. **Implicação**: o consequente da regra é cortado na altura h(r), ou seja, μr(z) = min(h(r), μconsequente(z)). Regra com h = 0 não contribui.
4. **Agregação**: para cada z pega o máximo entre as regras (não soma as áreas).
5. **Defuzzificação**: centroide numérico pelo método dos pontos médios:

```
N = 30 / Δz
z(k) = (k + 0,5) * Δz     para k = 0 até N-1
z* = soma( z(k) * μ(z(k)) ) / soma( μ(z(k)) )
```

Só arredondamos na hora de mostrar na tela. Se o denominador der zero, o programa mostra "Não há saída agregada válida" em vez de retornar zero.

### Função de pertinência

Usamos a função com 4 pontos (a, b, c, d). Primeiro testa se b ≤ x ≤ c (retorna 1), depois se x está fora de [a, d] (retorna 0), e só depois calcula as rampas. Assim não tem divisão por zero quando a = b ou c = d.

### Conjuntos

| Variável | Conjunto | (a, b, c, d) |
|---|---|---|
| Umidade (%) | seco | (0, 0, 20, 50) |
| Umidade (%) | intermediário | (20, 50, 50, 80) |
| Umidade (%) | úmido | (50, 80, 100, 100) |
| Temperatura (°C) | baixa | (10, 10, 15, 25) |
| Temperatura (°C) | média | (15, 25, 25, 35) |
| Temperatura (°C) | alta | (25, 35, 40, 40) |
| Tempo (min) | curto | (0, 0, 0, 15) |
| Tempo (min) | médio | (0, 15, 15, 30) |
| Tempo (min) | longo | (15, 30, 30, 30) |

### Regras padrão

| Regra | Solo | Temperatura | Tempo |
|---|---|---|---|
| R1 | seco | baixa | médio |
| R2 | seco | média | longo |
| R3 | seco | alta | longo |
| R4 | intermediário | baixa | curto |
| R5 | intermediário | média | médio |
| R6 | intermediário | alta | longo |
| R7 | úmido | baixa | curto |
| R8 | úmido | média | curto |
| R9 | úmido | alta | curto |

Na tela dá pra trocar o consequente de cada regra (curto, médio ou longo). Os antecedentes ficam fixos.

## Como usar

1. Abrir o link do GitHub Pages (não precisa de login nem instalar nada) ou abrir o `index.html` no navegador.
2. Escolher a umidade (começa em 35%), a temperatura (começa em 30 °C) e o passo Δz (começa em 0,1). Dá pra usar o campo numérico ou o deslizante.
3. Se quiser, mudar o consequente de alguma regra na tabela.
4. Usar os botões:
   - **Calcular**: faz a inferência toda de uma vez.
   - **Avançar etapa**: mostra uma etapa por vez, na ordem das 5 etapas.
   - **Restaurar padrão**: volta entradas, regras e passo para o valor inicial e limpa os resultados.
5. Depois de calcular, clicar numa linha da tabela de regras mostra o consequente e o recorte daquela regra no gráfico.
6. A caixa "Passo a passo da execução" mostra os valores de cada etapa.

Se algum campo estiver vazio, não for número, ou estiver fora do intervalo (U fora de 0 a 100, T fora de 10 a 40), o cálculo é bloqueado e aparece uma mensagem de erro. O valor não é ajustado sozinho para o limite. Quando alguma entrada, regra ou o passo muda, os resultados antigos são limpos, aparece um aviso e as etapas voltam pro começo.

## Gráficos

- Entradas: os 3 conjuntos de umidade e os 3 de temperatura, com uma linha vertical no valor digitado. Os graus de pertinência aparecem escritos embaixo, inclusive os que são zero.
- Regras: tabela com as 9 regras, as ativadas ficam destacadas e mostra o h(r).
- Recorte: o consequente da regra selecionada cortado na altura h(r).
- Saída: conjuntos curto, médio e longo, a área agregada preenchida e uma linha vertical no centroide, com o tempo recomendado em minutos (2 casas decimais).

Os gráficos são desenhados em canvas, com o eixo y indo de 0 a 1 (grau de pertinência) e o eixo x com a variável e a unidade.

## Arquivos

- `index.html`: estrutura da página
- `style.css`: estilo
- `script.js`: pertinência, inferência, validação e gráficos
- `README.md`: este arquivo

## Bibliotecas

Não usamos nenhuma biblioteca. Os gráficos são feitos com o canvas do próprio navegador.

## Testes

Salvo quando dito o contrário, os testes usam a base padrão e Δz = 0,1.

### 6.1 Pertinências e extremos

Ordem: (seco, intermediário, úmido) para umidade e (baixa, média, alta) para temperatura.

| Entrada | Obtido | Esperado | Resultado |
|---|---|---|---|
| U = 35% | (0,5; 0,5; 0) | (0,5; 0,5; 0) | ok |
| T = 30 °C | (0; 0,5; 0,5) | (0; 0,5; 0,5) | ok |
| U = 0% | (1; 0; 0) | (1; 0; 0) | ok |
| U = 100% | (0; 0; 1) | (0; 0; 1) | ok |
| T = 10 °C | (1; 0; 0) | (1; 0; 0) | ok |
| T = 40 °C | (0; 0; 1) | (0; 0; 1) | ok |

Conclusão: os graus e os extremos deram certo e não teve divisão por zero.

### 6.2 Uma única regra ativada

| Entrada | Regra | h | Tempo obtido | Esperado | Resultado |
|---|---|---|---|---|---|
| U = 20%, T = 35 °C | R3 | 1 | 24,999889 (25,00 min) | ≈ 25,00 | ok |
| U = 50%, T = 25 °C | R5 | 1 | 15,000000 (15,00 min) | 15,00 | ok |
| U = 80%, T = 25 °C | R8 | 1 | 5,000111 (5,00 min) | ≈ 5,00 | ok |

Conclusão: em cada caso só uma regra ativou e a saída ficou igual ao conjunto inteiro (longo, médio e curto). O 25 e o 5 vêm do centroide do triângulo e não do pico, por isso solo úmido não dá tempo zero.

### 6.3 Inferência completa com sobreposição

Entrada: U = 35%, T = 30 °C, Δz = 0,1.

Fuzzificação: seco = 0,5; intermediário = 0,5; úmido = 0; baixa = 0; média = 0,5; alta = 0,5.

Regras ativadas:

| Regra | Cálculo | h | Consequente |
|---|---|---|---|
| R2 | min(0,5; 0,5) | 0,5 | longo |
| R3 | min(0,5; 0,5) | 0,5 | longo |
| R5 | min(0,5; 0,5) | 0,5 | médio |
| R6 | min(0,5; 0,5) | 0,5 | longo |

As outras (R1, R4, R7, R8, R9) ficaram com h = 0.

Os conjuntos médio e longo foram cortados em 0,5 e juntados com o máximo. Mesmo com três regras dando "longo" (R2, R3 e R6), a altura não passou de 0,5. A área agregada ficou μ(z) = z/15 de 0 a 7,5 min e μ(z) = 0,5 de 7,5 a 30 min (μ(0) = 0; μ(3) = 0,2; μ(7,5) = 0,5; μ(15) = 0,5; μ(30) = 0,5).

Centroide: 16,785683 min, que aparece como 16,79 min na tela. O centroide contínuo de referência é 16,785714, então o erro é de uns 0,000031 min.

Conclusão: deu o esperado, e a agregação usou máximo e não soma.

### 6.4 Simetria, mudança de regras e precisão

**Simetria (U = 35%, T = 20 °C):** R1, R2, R4 e R5 ativaram com h = 0,5. Os três conjuntos de saída ficam cortados em 0,5 e a agregação fica constante em 0,5 de 0 a 30. Tempo obtido: 15,00 min (esperado 15,00). ok.

**Mudando as regras:** colocando "curto" como consequente das 9 regras e usando U = 50%, T = 25 °C, só a R5 ativa (h = 1) e o tempo deu 5,000111, ou seja, 5,00 min (esperado ≈ 5,00). ok. Depois de clicar em Restaurar padrão, as entradas (35% e 30 °C), as regras e o passo voltam ao inicial, e calculando de novo o resultado é 16,79 min. ok.

**Passo Δz (teste 6.3 repetido):**

| Δz (min) | N | Obtido (min) | Esperado (min) | Diferença para o contínuo (16,785714) |
|---|---|---|---|---|
| 0,1 | 300 | 16,785683 | ≈ 16,785683 | ≈ 0,000031 |
| 0,05 | 600 | 16,785706 | ≈ 16,785706 | ≈ 0,000008 |
| 0,01 | 3000 | 16,785714 | ≈ 16,785714 | menor que 0,000001 |

Análise: quanto menor o Δz, mais pontos são usados para calcular o centroide, e o resultado chega mais perto do valor contínuo. Passando de 0,1 para 0,05 o erro caiu umas 4 vezes. Como a área agregada é feita só de retas, o erro já é bem pequeno com 0,1, e por isso com duas casas decimais o resultado continua 16,79 nos três passos. O que muda é só que com passo menor o programa faz mais contas.

### 6.5 Interface e determinismo

Entradas inválidas (o cálculo é bloqueado e o valor não é corrigido sozinho):

| Entrada | Mensagem |
|---|---|
| U = -1% | Umidade inválida: informe um valor entre 0% e 100%. |
| U = 101% | Umidade inválida: informe um valor entre 0% e 100%. |
| T = 9 °C | Temperatura inválida: informe um valor entre 10°C e 40°C. |
| T = 41 °C | Temperatura inválida: informe um valor entre 10°C e 40°C. |
| campo vazio | Preencha os campos de umidade e temperatura. |
| texto (não numérico) | o campo numérico do navegador não aceita letras, então fica vazio e cai na mensagem de campo vazio |

Determinismo: não tem nada aleatório no cálculo, então repetir a mesma configuração dá sempre os mesmos graus, ativações, área agregada e tempo final. O botão Calcular e o Avançar etapa usam a mesma função de inferência, então os dois chegam no mesmo resultado (16,785683, mostrado como 16,79 min no caso padrão). A parte de desenhar os gráficos é separada do cálculo e não altera os valores.

## Observações

- O sistema não simula a água no solo, nem usa sensores, nem controla equipamento. É só um simulador.
- O tempo calculado vem da inferência fuzzy, não de aprendizado de máquina.
