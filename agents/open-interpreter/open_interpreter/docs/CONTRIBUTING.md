# Contributing to Open Interpreter 

Thank you for your interest in contributing! As an open source project, we rely on developers like you to make conversational AI accessible.

There are many ways to contribute, from reporting bugs and suggesting features to improving the code. We appreciate you taking the time to get involved.

## Roadmap

We are working on developing a public roadmap to provide visibility into our priorities and upcoming enhancements.

For now, our focus is on resolving issues with CodeLlama integration and keeping the core interpreter logic simple and understandable. We want to empower non-coders by turning natural language into executable actions.

As such, we aim to keep the codebase simplified rather than overly complex. Our goal is to give the power of coding - turning words into actions - to people without coding knowledge. We welcome discussions on how to maintain this approach as we add new capabilities.

## Reporting Issues

If you encounter a bug or have a brilliant feature in mind, don't hesitate to [open a new issue](https://github.com/KillianLucas/open-interpreter/issues/new/choose). To ensure a swift and effective response, please provide the following:

- **Bug Reports:** Include detailed steps to reproduce the issue, along with specifics about your operating system and Python version, with screenshots and code/error snippets if required.
- **Feature Requests:** Provide a comprehensive explanation of how your idea benefits Open Interpreter and its community.

## Contributing Code

We welcome code contributions through pull requests. Here are some guidelines:

- Before taking on significant code changes, please discuss your ideas on [Discord] to ensure they align with our project vision. We want to keep the codebase simple and unintimidating for new users.

- Fork the repository and create a new branch for your work.

- Make changes with clear code comments explaining your approach. Try to follow existing conventions in the code.

- Open a PR to `main` linking any related issues. Provide detailed context on your changes.

- We will review PRs when possible and work with you to integrate your contribution. Please be patient as reviews take time. 

- Once approved, your code will be merged - thank you for improving Open Interpreter!

### Code Formatting and Linting

Our project uses `black` for code formatting and `isort` for import sorting. To ensure consistency across contributions, please adhere to the following guidelines:

1. **Install Pre-commit Hooks**:
   
   If you want to automatically format your code every time you make a commit, install the pre-commit hooks.
   
   ```bash
   pip install pre-commit
   pre-commit install
   ```

   After installing, the hooks will automatically check and format your code every time you commit.

2. **Manual Formatting**:

   If you choose not to use the pre-commit hooks, you can manually format your code using:

   ```bash
   black .
   isort .
   ```

## Running Your Local Fork

Once you've forked the code and created a new branch for your work, you can run the fork in CLI mode by following these steps:

1. CD into the project folder `/open-interpreter`
2. Install dependencies `poetry install`
3. Run the program `poetry run interpreter`

After modifying the source code, you will need to do `poetry run interpreter` again.

**Note**: This project uses [`black`](https://black.readthedocs.io/en/stable/index.html) and [`isort`](https://pypi.org/project/isort/) via a [`pre-commit`](https://pre-commit.com/) hook to ensure consistent code style. If you need to bypass it for some reason, you can `git commit` with the `--no-verify` flag.

### Installing New Packages

If you wish to install new dependencies into the project, please use `poetry add package-name`.

#### Installing Developer Dependencies

If you need to install dependencies specific to development, like testing tools, formatting tools, etc. please use `poetry add package-name --group dev`.

### Known Issues

For some, `poetry install` might hang on some dependencies. As a first step, try to run the following command in your terminal:  
  
`export PYTHON_KEYRING_BACKEND=keyring.backends.fail.Keyring`  
  
Then run `poetry install` again. If this doesn't work, please join our [Discord community][discord] for help.

## Questions?

Join our [Discord community][discord] to connect with contributors. We're happy to guide you through your first open source contribution!

## Licensing

Contributions to open-interpreter would be under the MIT license. 

Thank you for your dedication and understanding as we continue refining our processes. We sincerely appreciate your involvement!

[discord]: https://discord.gg/6p3fD6rBVm
