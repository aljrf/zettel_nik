# flashcardism

### Single-line Basic (Remnote style)
The prompt and the answer are separated by `::` (this can be configured in settings).
<!--SR:!2024-02-03,1,230-->

```
the question goes on this side :: answer goes here!
```

### Single-line Reversed

Creates two cards `side1:::side2` & the reversed version `side2:::side1`.
<!--SR:!2000-01-01,1,250!2024-02-03,1,230-->

The prompt and the answer are separated by `:::` (this can be configured in settings).
<!--SR:!2024-02-03,1,230!2024-02-03,1,230-->


```
answer goes here ::: question goes here!
```

Note: In the first review, the plugin will show non-reversed card and reversed card. If **Bury sibling cards until the next day?** turn on, only non-reversed card will appear.

### Multi-line Basic

The front and the back of the card are separated by `?` (this can be configured in settings).

These can also span over multiple lines as long as both sides "touch" the `?`:

![[image-20240202164104868.png]]

### Multi-line Reversed

Creates two cards `side1??side2` & the reversed version `side2??side1`.

The front and the back of the card are separated by `??` (this can be configured in settings).
![[image-20240202164137404.png]]

### Using Obsidian Tags

1. Specify flashcard tags in settings (`#flashcards` is the default).
2. Tag any notes that you'd like to put flashcards using said tags.

#### Hierarchical Tags

Note that `#flashcards` will match nested tags like `#flashcards/subdeck/subdeck`.

### Using Folder Structure

The plugin will automatically search for folders that contain flashcards & use their paths to create decks & sub-decks i.e. `Folder/sub-folder/sub-sub-folder` ⇔ `Deck/sub-deck/sub-sub-deck`.

This is an alternative to the tagging option and can be enabled in settings.

## Reviewing

Once done creating cards, click on the flashcards button on the left ribbon to start reviewing the flashcards. After a card is reviewed, a HTML comment is added containing the next review day, the interval, and the card's ease.
