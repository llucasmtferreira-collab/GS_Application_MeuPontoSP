# Meu Ponto SP 

**Global Solution 2026.2 — Application Development**  
2º ano de Ciência da Computação | Prof. Rodrigo Moraes

## Sobre o projeto

O **Meu Ponto SP** é um aplicativo web criado para ajudar quem utiliza ônibus municipais em São Paulo. Ele permite procurar pontos de ônibus e consultar as previsões de chegada dos veículos, utilizando dados da **API Olho Vivo da SPTrans**.

A ideia é facilitar a consulta dos horários antes de sair de casa ou enquanto a pessoa espera no ponto.

## Funcionalidades

- Buscar pontos de ônibus por nome ou endereço.
- Selecionar um ponto e consultar as previsões de chegada disponíveis.
- Visualizar a linha, o destino, o horário previsto e a informação de acessibilidade do veículo, quando fornecida pela API.
- Salvar e remover pontos favoritos, mantendo-os no navegador com `localStorage`.
- Atualizar as previsões manualmente ou de forma automática a cada 60 segundos.
- Abrir a localização do ponto no Google Maps, quando houver coordenadas disponíveis.
- Utilizar o aplicativo no computador ou no celular, com layout responsivo.

As informações são fornecidas pela SPTrans. As previsões podem mudar de acordo com as condições do trânsito e nem sempre há dados disponíveis para todas as linhas ou pontos.

## Tecnologias utilizadas

- **HTML:** estrutura da página.
- **CSS:** estilos, organização dos elementos e responsividade.
- **JavaScript:** interação com a página, buscas, apresentação dos resultados e favoritos.
- **Node.js:** comunicação com a API da SPTrans sem expor o token no navegador.
- **API Olho Vivo (SPTrans):** dados dos pontos e previsões de chegada.

## Como executar o projeto

Para executar localmente, é necessário ter o **Node.js 22** instalado e um **token de acesso à API Olho Vivo**, obtido na [área de desenvolvedores da SPTrans](https://www.sptrans.com.br/desenvolvedores/).

1. Baixe ou clone este repositório e abra a pasta do projeto.
2. Crie um arquivo chamado `.env` a partir de `.env.example`.
3. No arquivo `.env`, configure a variável com seu token:

   ```env
   SPTRANS_TOKEN=SEU_TOKEN_DA_SPTRANS
   ```

4. No terminal, dentro da pasta do projeto, execute:

   ```bash
   npm run dev
   ```

5. Acesse **http://localhost:3000** no navegador.

O projeto não utiliza dependências externas, portanto não é necessário executar `npm install`. O arquivo `.env` não deve ser publicado, pois contém o token de acesso.

Para disponibilizar o aplicativo na **Vercel**, também é necessário configurar a variável de ambiente `SPTRANS_TOKEN` nas configurações do projeto.

## Estrutura dos arquivos

```text
GS_Application_MeuPontoSP/
├── index.html          Página principal
├── style.css           Estilos e responsividade
├── script.js           Funcionalidades do aplicativo
├── favicon.svg         Ícone da página
├── api/
│   ├── paradas.js      Consulta de pontos
│   └── previsao.js     Consulta de previsões
├── lib/
│   └── sptrans.js      Integração e autenticação na SPTrans
├── servidor-local.js   Servidor para execução local
├── package.json        Comandos para executar e testar
├── .env.example        Exemplo da configuração do token
├── .gitignore          Arquivos que não são enviados ao GitHub
├── testes/             Testes automatizados do projeto
├── PARTICIPANTE.txt   Identificação do responsável pelo trabalho
└── README.md           Documentação do projeto
```

## Integração com a API

O projeto utiliza três endpoints da API Olho Vivo:

| Método | Endpoint | Função |
| --- | --- | --- |
| `POST` | `/Login/Autenticar` | Autenticação com token e criação da sessão. |
| `GET` | `/Parada/Buscar` | Busca dos pontos de ônibus. |
| `GET` | `/Previsao/Parada` | Consulta das previsões de chegada em um ponto. |

As consultas passam pelo servidor do próprio projeto para manter o token fora do código executado no navegador.

## Testes

O projeto inclui testes automatizados de JavaScript e das funções de consulta. Nesses testes, as respostas da SPTrans são simuladas para verificar o comportamento do código. Para conferir os dados reais, é necessário configurar um token válido e testar o aplicativo em execução.

Para executar os testes:

```bash
npm test
```

As consultas em tempo real dependem de um token válido e da disponibilidade de dados na SPTrans.

## Autoria e créditos

Projeto acadêmico individual desenvolvido para a Global Solution 2026.2. A identificação do participante está no arquivo `PARTICIPANTE.txt`.

**Fonte dos dados:** SPTrans — API Olho Vivo. Este aplicativo não é um serviço oficial da SPTrans.

[Documentação da API Olho Vivo](https://www.sptrans.com.br/desenvolvedores/api-do-olho-vivo-guia-de-referencia/documentacao-api)
