# Relatorios e produtos

Checkpoint: `96d5f6e3d32a8b02dd24a7d9c9c09bc2f1e97b86`

Branch: `visual/platform-reports-premium-v1`

Tag: `platform-reports-final-candidate-v1`

Status: `PRONTO_PARA_INSPECAO_FINAL`

Esta candidata nao esta registrada como aprovada por inspecao humana. Ela deve permanecer isolada ate declaracao posterior explicita.

## Produtos funcionais

1. Operacional TIRH.
2. Cientifico TIRH.
3. Executivo.
4. Tecnico.
5. Formulacao Regulatoria.

## Superficies refinadas

- Biblioteca de produtos.
- Leitura detalhada.
- Governanca.
- Acessos nominais.
- Linhagem e proveniencia.
- Versoes.
- Impressao web.

## Produtos condicionados a dados e contratos

- Executivo completo.
- Organizacional.
- Longitudinal.
- Ciclos.
- Evidencias.
- Proveniencia completa.

Esses produtos ou secoes somente podem ser apresentados quando os dados, contratos e comparacoes canonicas existirem.

## Produtos deliberadamente nao inventados

- Baseline autonomo sem contrato.
- PRE/TREINO/POS autonomos sem contrato.
- Ciclo autonomo.
- Coorte sem contrato.
- Longitudinal organizacional sem contrato.

**Nao inventar produto cientifico apenas para completar uma lista.**

## Beneficios da camada premium

- Identidade visual coerente com a Plataforma.
- Hierarquia e leitura aprimoradas.
- Visualizacao digital e impressao.
- Composicao A4.
- Tabelas e graficos mais legiveis.
- Paginacao controlada.
- Proveniencia e versoes explicitas.
- PDF preservado.

## Evidencia tecnica do diff

Comparacao entre a UI operacional `79202dd...` e a candidata de Relatorios `96d5f6e...`:

- `app/(platform)/report-command.css`: camada visual isolada dos Relatorios.
- `app/(platform)/layout.tsx`: carregamento escopado da camada visual.
- Diff registrado: 2 arquivos e 936 insercoes.
- Nenhum arquivo de calculo, persistencia, API, sensor ou backend foi alterado nessa diferenca.

## Validacao registrada

- 5 produtos.
- 20 paginas A4 nas fixtures de verificacao.
- Conteudo cientifico preservado.
- Calculos preservados.
- 194/194 testes.
- TypeScript PASS.
- Build PASS.

## Gate antes de integracao

1. Aguardar GOLDEN funcional.
2. Inspecao humana final da candidata.
3. Sincronizar sobre o GOLDEN funcional, nunca o inverso.
4. Classificar o diff.
5. Exigir `FUNCIONAL=ZERO` para a camada exclusivamente visual.
6. Reexecutar testes, TypeScript, build e fixtures A4.
7. Validar PDF, impressao, versoes e proveniencia.
