# On a per file basis

* Define the front matter between two lines containinfg three dashes. The front matter must contain the name of the target deck, like so:


```
---
cards-deck: verduras enfurecidas
---
```

Sub decks can be specified:

```
---
cards-deck: verduras enfurecidas::pepinillo rabioso
---
```

# Tags

To define the tags that should be used in Anki, there are two approaches.


```
---
tags: global-tag1, global-tag2
---

## This is the front #card #my-local-tag
This is the back of the card.

```

## This is the front # card
 
This is the back of the card.


This line will not be part of it, because there is an empty line above.

### This is a normal and reversed card # card-reverse
Which means that two cards will be generated on Anki.


This could be another question # card
But this time without the heading.
^1614265375567

## This is another way to define the front
# card 
This style is usefull to avoid the hashta


```

Once uploaded to Anki an ID appears after each succesful card.

Inline style can be used like so:

```
My question::My answer

My question:: My answer
My question ::My Answer
My question :: My answer
```

``` #card-spaced^1614265375618
``` is used to mark a line that periodically appears but does not count towards remembering.

### Insert

Write the cards and just run the command above. The insertion operation will add cards on Anki. While, in Obsidian it will add an ID to keep track of them.
<!--ID: 1634479815236-->


### Update

Just edit the card in Obsidian, and run the command above.  
**NOTE: Make certain that when you want to update the BROWSE window of Anki is closed.** Unfortunately, this is a bug that is not my under control, but it's a problem tied up with the Anki APIs I am using.
<!--ID: 1634479815242-->


### Delete

Delete the content of the card in Obsidian, but without deleting the ID. The plugin will take care of it. So for example
<!--ID: 1634479815248-->

#teach