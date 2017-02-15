# git-select
Quick and dirty way to create and select recently used branches interactively from the command line. Branches are sorted in descending order by `committerdate`, and hitting enter over your choice will checkout that branch for you. This means you can easily swap between your most recently updated branches.

## Checking out recent branches

![git-select](https://cloud.githubusercontent.com/assets/7237525/22659875/48266196-ec97-11e6-8f9c-ff8da1a20f99.gif)

## Creating new branches

![git-select-new](https://cloud.githubusercontent.com/assets/7237525/22977077/2dae52ca-f385-11e6-8441-b78e3d718d96.gif)

It was inspired by the Merginal plugin for Vim, and just leverages node's `inquirer` library and parses git branches as explained here http://stackoverflow.com/a/5188364/6457275.

## Installation
```
npm install -g git-select
```

## Requirements
Node (should work on any version, but it's untested on the really old ones)

## Next steps
- [x] Ability to create new branches
- [ ] Custom formatting
- [ ] Better git parsing approach (less hacky)
