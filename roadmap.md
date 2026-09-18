# Roadmap — BeD Produtos Naturais

Sistema de estoque e vendas porta a porta (dono / supervisor / vendedor).

## Infra
- [ ] Ativar Lovable Cloud (banco + auth + storage)
- [ ] Migration: schema completo (produtos, equipes, estoques, vendas, campanhas, histórico, localização) + GRANTs + RLS
- [ ] Tabela de papéis (user_roles) + função has_role

## Auth
- [ ] Tela de login/cadastro (e-mail/senha)
- [ ] Guards por papel (dono, supervisor, vendedor)

## Dono
- [ ] Dashboard geral (estoque, campo, vendas hoje, supervisores, vendedores, campanhas)
- [ ] CRUD de produtos (+ código de barras, custo, venda, estoque)
- [ ] Escanear código de barras pela câmera
- [ ] Entrada/saída de estoque (+/−) com histórico
- [ ] Alerta de estoque baixo
- [ ] Mais vendidos / faturamento
- [ ] Cadastrar supervisores e equipes
- [ ] Histórico de movimentações
- [ ] Rastreio: supervisor → equipe → vendedor → dia → venda → comprovante

## Supervisor
- [ ] Dashboard da equipe (produtos, estoque, valor, vendas do dia)
- [ ] Entrega de estoque ao vendedor (saída central → vendedor)
- [ ] Mapa da equipe (localização em tempo real, com consentimento)
- [ ] Campanhas de 20 dias (dias, vendas por vendedor)

## Vendedor
- [ ] Meu estoque (produtos recebidos)
- [ ] Nova venda (produto, quantidade, pagamento)
- [ ] Comprovante: foto da ficha + assinatura na tela
- [ ] Enviar localização (com consentimento explícito)

## Design
- [ ] Design system natural/verde em src/styles.css
- [ ] Páginas com head() próprio
