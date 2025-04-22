---
tags: software
---


# vim grep

Make sure Vim's current working directory is the root of the project:

```
     :cd {path to root directory}
```

You can use `:pwd` to print the current working directory and ensure that it is correct.

# 2. **Find files that contain 'Sam'**

Use Vim's `:vimgrep` command to search for all occurrences of `Sam` within the project:

```
    :vimgrep /Sam/gj **/*
```

### Notes:

-   `Sam` is the search "pattern" sandwiched between two forward slashes
-   The `**/*` says to search in all files recursively
-   The `g` flag says to search for all occurrences in each line (this is actually overkill here, but it does not hurt either)
-   The `j` flag prevents vim from automatically jumping to the first match

This will populate the quickfix list with all instances of `Sam`. If you want to view the quickfix list, you can use the Vim command `:copen`

[![enter image description here](https://i.stack.imgur.com/4t4JT.png)](https://i.stack.imgur.com/4t4JT.png)

# 3. **Substitute within all files that contain 'Sam'**

Now we want to run Vim's `:substitute` command inside every file in the quickfix list. We can do this using the `:cfdo {cmd}` command which executes `{cmd}` in each file in the quickfix list. The specific `{cmd}` we want to use is `:substitute` or `:s` for short. The full line would look like:

```
    :cfdo %s/Sam/Bob/gc
```

### Notes:

-   The `%` is a line range that specifies _every_ line
-   The `g` flag says to substitute _all_ occurrences in each line
-   The `c` flag causes vim to ask you to confirm each replacement individually (you might want to leave this out)

# 3. **Save all files**

```
    :cfdo update
```