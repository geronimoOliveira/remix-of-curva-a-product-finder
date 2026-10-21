<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Normalize Apify Actor output in a pure client-safe helper so search filters and Curva A calculations share tested data.
- Workspace Apify credentials use the connector gateway; optional visitor-owned tokens are used only for the current request and are never persisted or logged.
