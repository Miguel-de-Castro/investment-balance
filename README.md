# Investment Balance 📈

**Investment Balance** é um simulador moderno e intuitivo para investidores. Ele permite calcular o novo **Preço Médio** após aportes e verificar o **Preço Teto** (Método Bazin) para ativos geradores de renda.

O aplicativo suporta Ações Brasileiras, Fundos Imobiliários (FIIs), Criptomoedas e Ações Americanas (Stocks).

---

## 🛠️ Stack Tecnológico

Abaixo estão as principais tecnologias e bibliotecas utilizadas na construção deste projeto:

### Core & Linguagem
*   ![React](https://img.shields.io/badge/React_19-20232a?style=for-the-badge&logo=react&logoColor=61DAFB) **React** - Biblioteca para construção da interface.
*   ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) **TypeScript** - Superset JavaScript com tipagem estática.

### Estilização & UI
*   ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) **Tailwind CSS** - Framework CSS utilitário para estilização rápida e responsiva.
*   ![Lucide](https://img.shields.io/badge/Lucide_React-F78166?style=for-the-badge&logo=lucide&logoColor=white) **Lucide React** - Biblioteca de ícones vetoriais leves.

### Navegação & Roteamento
*   ![React Router](https://img.shields.io/badge/React_Router_v7-CA4245?style=for-the-badge&logo=react-router&logoColor=white) **React Router DOM** - Gerenciamento de rotas e navegação SPA.

### Integrações e APIs Externas
*   🌐 **Fetch API** - Para requisições HTTP nativas.
*   🇧🇷 **BRAPI** - Dados de Ações e FIIs do Brasil.
*   🪙 **CoinGecko** - Dados de Criptomoedas em tempo real.
*   🇺🇸 **Alpha Vantage** - Dados do mercado americano.

### Gerenciamento de Estado & Armazenamento
*   💾 **LocalStorage** - Persistência local do histórico de busca.
*   ⚛️ **React Hooks** - Gerenciamento de estado funcional (`useState`, `useEffect`, `useMemo`).

---

## 🚀 Funcionalidades

1.  **Simulador de Preço Médio:**
    *   Cálculo automático do novo PM após compra.
    *   Visualização de lucro/prejuízo potencial.
    *   Identificação automática do tipo de ativo (BR, EUA, Cripto).

2.  **Calculadora Décio Bazin (Preço Teto):**
    *   Cálculo baseado no Dividend Yield ou valor pago em proventos.
    *   Definição de margem de segurança.
    *   Indicador visual de "Compra Segura" ou "Caro".

3.  **Histórico & Busca:**
    *   Histórico local dos últimos ativos consultados.
    *   Busca inteligente com autocomplete.

## ⚙️ Configuração (Variáveis de Ambiente)

Para utilizar dados reais das APIs pagas (opcional), renomeie o arquivo `.env.example` para `.env` e adicione suas chaves:

```env
# API para Ações Brasileiras e FIIs (https://brapi.dev)
VITE_BRAPI_TOKEN=seu_token_aqui

# API para Ações Americanas (https://www.alphavantage.co)
VITE_ALPHA_VANTAGE_KEY=sua_key_aqui
```

> **Nota:** Se as chaves não forem fornecidas, o app utilizará dados simulados (Mock) para demonstração.

---

<div align="center">
  <sub>Desenvolvido para fins educacionais e de simulação.</sub>
</div>