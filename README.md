# ddu-source-git_status

Git status source for ddu.vim

## Required

### denops.vim

https://github.com/vim-denops/denops.vim

### ddu.vim

https://github.com/Shougo/ddu.vim

### ddu-kind-file

https://github.com/Shougo/ddu-kind-file

### ddu-ui-ff

https://github.com/Shougo/ddu-ui-ff

## Configuration

```vim
call ddu#start(#{ ui: 'ff', sources: [#{ name: 'git_status' }] })
```

