### 🧠 Additional Things to Ask the Dev Intern:

1. **Issue Categorization**

   * Group issues as:

     * `Bug`
     * `Enhancement`
     * `UI/UX`
     * `Refactor`
     * `Feature Request`
   * Add labels or headers in the `TODO.md`.

2. **Steps to Reproduce (for Bugs)**

   * Ask them to mention:

     * How to trigger the bug.
     * What was expected vs. what happened.

3. **Screenshots (if UI related)**

   * Ask them to attach "before" and "after" screenshots or mark the UI issue area.

4. **Priority Tagging**

   * Low / Medium / High — based on how critical the issue is.

5. **Impact Analysis**

   * If a change touches multiple modules or shared components, mention it.
   * Ask: “Will this change break anything else?”

6. **Testing Plan**

   * What manual test or unit test needs to be run after the change.
   * If possible, add a checklist for test cases.

7. **Commit Message Suggestion**

   * Ask them to write a sample commit message following conventional commits:
     `fix(component): resolve null crash on chat render`

8. **Assigned Owner**

   * If you have multiple interns/devs, ask them to assign each task to a person.

---

### 🗂️ Final Output Structure for `TODO.md` per Issue:

````md
### Issue #12 - Chat screen crash on model switch
- **Category:** Bug
- **Priority:** High
- **Affected Files:**
  - `src/components/ChatContainer.tsx`
- **Suggested Fix:**
```tsx
if (!model) return null; // guard added
````

* **To-Do:**

  * [ ] Add guard for null model
  * [ ] Test switching models mid-chat
  * [ ] Verify it doesn't break rerender
* **Commit Message:** `fix(chat): add guard for null model during switch`
* **Assigned To:** InternName

```
