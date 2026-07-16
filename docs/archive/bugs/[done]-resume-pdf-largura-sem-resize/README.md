# 🐛 Resume — Largura do PDF calculada apenas no carregamento inicial

**Status:** `done`
**Data:** 2026-07-08
**Prioridade:** `média`
**Tags:** `frontend`, `ui-ux`

---

## Descrição
A largura do componente `<Page>` do `react-pdf` na seção Resume é calculada uma única vez no momento da renderização, usando `window.innerWidth` diretamente no JSX. Isso significa que se o usuário redimensionar a janela após o carregamento da página, o PDF permanece com a largura original e não se adapta.

## Como Reproduzir
1. Abrir o portfólio em desktop com a janela em largura máxima
2. Rolar até a seção "My Resume"
3. Observar que o PDF renderiza com uma largura correta
4. Redimensionar a janela do browser para uma largura menor (ex: de 1440px para 768px) sem recarregar
5. Observar que o PDF permanece com a largura do carregamento inicial, transbordando ou ficando desalinhado

## Comportamento Esperado
O PDF deve se adaptar dinamicamente ao redimensionamento da janela, respeitando sempre `Math.min(890, window.innerWidth - 20)`.

## Comportamento Atual
A largura é calculada inline no JSX, avaliada apenas uma vez no render estático:
```tsx
// src/components/main/Resume.tsx — linha 67
width={Math.min(890, typeof window !== 'undefined' ? window.innerWidth - 20 : 1200)}
```
Não existe `useState` + `useEffect` + listener de `resize` para atualizar o valor dinamicamente.

## Contexto Técnico
- Camada afetada: frontend
- Arquivo(s) suspeito(s): `src/components/main/Resume.tsx` (linha 67)
- Logs de erro (se houver): nenhum

## Hipótese de Causa
O valor `window.innerWidth - 20` é lido somente durante o render. Como não há subscription ao evento `window.resize`, o componente nunca é notificado de que a viewport mudou e não re-renderiza.

## Plano de Correção
1. Em `src/components/main/Resume.tsx`, criar um estado `containerWidth`:
   ```tsx
   const [containerWidth, setContainerWidth] = useState(
     typeof window !== 'undefined' ? Math.min(890, window.innerWidth - 20) : 890
   )
   ```
2. Adicionar um `useEffect` que escuta o evento `resize`:
   ```tsx
   useEffect(() => {
     const handleResize = () => {
       setContainerWidth(Math.min(890, window.innerWidth - 20))
     }
     window.addEventListener('resize', handleResize)
     return () => window.removeEventListener('resize', handleResize)
   }, [])
   ```
3. Substituir o atributo `width` do `<Page>` por `{containerWidth}`
4. Testar redimensionamento em desktop e dispositivos mobile

---

## Review

### Feedback
> _(preencher durante o review)_

### Decisão
- [ ] Aprovado
- [ ] Alterações solicitadas

---

## Validação

> _(preencher após execução e teste)_

- [x] Bug não reproduz mais
- [x] Nenhuma regressão identificada
- [x] **Pasta renomeada para `[done]-resume-pdf-largura-sem-resize`**
