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

- Keep all AI evaluation prompts and gateway calls behind `createServerFn`; the browser sends only the question ID and student answer, so scoring rules and credentials remain server-side.
- Treat the 2027 Medicine Discursive Exam as the sole scoring model: EQ bonus + Biology × 2 + Chemistry + Essay, capped at 100.
