# The Roleplay Enchiridion

An open handbook for worldbuilders, writers, game masters, players and artists.

This is the book I wish I'd had when I started building worlds and running games: the questions worth asking, the techniques that worked at my own tables, and the tools I'd point a friend to (free ones first).

## How to use it

Read it in [Obsidian](https://obsidian.md/) (free, no account needed):

```sh
git clone https://github.com/Legends-of-Tolria/book-roleplay-enchiridion.git
```

Then in Obsidian choose **Open folder as vault** and pick the `content` folder. Start at `index.md`.

No Obsidian? Every page is plain Markdown, so you can read it right here on GitHub, starting at [`content/index.md`](content/index.md). A web edition is coming soon.

To build the web edition yourself (Node 22):

```sh
npm install
npm run build   # writes the site to public/
```

## The Workshop

The web edition comes with small tools that run in your browser: a converter that turns Word, PDF, Google Docs, web pages and text into tidy Markdown notes, and a starter that sets up a notes folder for your world, campaign or novel. Their code is in `site/tools/`.

## Contribute

Suggestions for tools, prompts and fixes are welcome as pull requests. See [How to Contribute](content/appendices/E-how-to-contribute.md).

## Licence

The text is licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/) (see `LICENSE`). Site and tool code is licensed under MIT (see `LICENSE-CODE`); bundled libraries keep their own licences (see `site/tools/vendor/licenses/`). Tool names and links belong to their makers.

Compiled by A.Z. at [Legends of Tolria](https://legendsoftolria.com/)
