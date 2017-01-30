CONTRIBUTING.md
===============

Code Standards
--------------

- Python: [Pep8](https://www.python.org/dev/peps/pep-0008/)

Committing
----------

- Do not commit to the `master` branch directly.
- Use the imperative mood for git messages (eg. add a Python to the Jungle)
- Test code before pushing to remote!

Branches
--------

#### Formatting
`<initial>/<descriptive-name>#<issueID>`

- `initial` is the first letter of your first name, in lower case
- `descriptive-name` should be a 1-3 word dash-spaced description of
the issue being worked on
- `#issueID` should be the issue number of the primary issue. If you are
working on multiple issues this should be the one of highest priority

Adding Dependencies
-------------------
- If your code requires a new dependency which is not in the master branch you must:
  - Update the README with description of dependency. Include:
    - The reason for dependency
    - Link to information about dependency
    - The size of dependency
  - Update the setup scripts for all OS

Pull Requests
-------------

#### Formatting
`Connects to #issue-number`

- Use this text as the first thing in the body of your PR to ensure wafflebot sorts the PR properly.
- All PRs should be tested by another team member before they are merged to master.
- If a PR is broken the tester should leave a comment with the specifics such as:
	- The stack trace
	- Steps to reproduce the problem

Adding Documentation
--------------------

- Don't create an issue for documentation updates unless one already exists.
- Use the `all/readme` branch.
- Merge the master branch into the `all/readme`, then do make your changes
- Create a pull request so that it can be reviewed.
