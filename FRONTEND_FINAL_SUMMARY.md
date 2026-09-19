# Frontend v1.5.8 Production Summary

v1.5.8 is a full UI/UX refinement of the direct-Django frontend. It intentionally preserves the approved theme, layout, sidebar, page hierarchy, charts and Lucide icon language.

## What changed
- Calculator upload supports click/keyboard/drag-drop and clearer validation/removal state.
- Invalid fields receive inline messages, red border/shadow, and first-error focus/scroll.
- Steps 2–3 carry forward validated workflow context and explain locked client assumptions.
- Results distinguish progress, engine errors, download errors, retained results and transient results.
- Long calculations show elapsed progress; successful transient results are session-cached to avoid silent reruns after refresh.
- Registration/login/profile forms have stronger field-level validation, password guidance and saved/unsaved states.
- Account outages are distinguished from true guest mode.
- History has search, counts, clearer status/empty states, claiming feedback and consistent in-app deletion confirmation.
- Tariffs have load/refresh/search/type-filter/count/empty states.
- Help adds troubleshooting for the real production failure modes.
- About exposes the actual browser → Django → Supabase/Octave architecture and app version.
- Admin filters, record editing, error/warning inspection and file actions are clearer and safer.
- All destructive confirmations use a consistent in-app dialog instead of native browser confirms.
- User/admin shells include skip links; active nav uses `aria-current`; focus/reduced-motion behavior is improved.
- Development debug overlay remains available without changing production UI.

See `FRONTEND_UI_UX_REVIEW_v1.5.8.md` and `FRONTEND_V1.5.8_REGRESSION_CHECKLIST.md` for the detailed review/test matrix.
