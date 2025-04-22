# Spaced rep

### Single-line Basic (Remnote style)[¶](https://www.stephenmwangi.com/obsidian-spaced-repetition/flashcards/#single-line-basic-remnote-style "Permanent link")

The prompt and the answer are separated by `::` (this can be configured in settings).

```
the question goes on this side::answer goes here!`
```

### Single-line Reversed[¶](https://www.stephenmwangi.com/obsidian-spaced-repetition/flashcards/#single-line-reversed "Permanent link")

Creates two cards `side1:::side2` & the reversed version `side2:::side1`.

The prompt and the answer are separated by `:::` (this can be configured in settings).

```
the question goes on this side:::answer goes here!`
```

### Multi-line Basic[¶](https://www.stephenmwangi.com/obsidian-spaced-repetition/flashcards/#multi-line-basic "Permanent link")

The front and the back of the card are separated by `?` (this can be configured in settings).

```
Front of multiline 
? 
Backside of multiline card`
```

These can also span over multiple lines as long as both sides "touch" the `?`:

```
As per the definition
of "multiline" the prompt
can be on multiple lines
?
same goes for
the answer
```


### Multi-line Reversed

Creates two cards `side1??side2` & the reversed version `side2??side1`.

The front and the back of the card are separated by `??` (this can be configured in settings).

```
Front of multiline
??
Backside of multiline card
```


These can also span over multiple lines as long as both sides "touch" the `??`:

```
As per the definition
of "multiline" the prompt
can be on multiple lines
??
same goes for
the answer
```

## Cloze cards

You can easily add cloze deletion cards using ==highlights==, **bolded text**, or {{text in curly braces}}.

These can be turned on or off in settings.

Anki style {{c1:This text}} would {{c2:generate}} {{c1:2 cards}} cloze deletions are not currently supported. This feature is being tracked here.

## Decks
![[image-20240319121128807.png]]



The green and blue counts on the right of each deck name represent due and new cards respectively.

## Using Obsidian Tags

Specify flashcard tags in settings (#flashcards is the default).
Tag any notes that you'd like to put flashcards using said tags.
Hierarchical Tags¶
Note that '#flashcards' will match nested tags like '#flashcards/subdeck/subdeck'.

Multiple Tags Within a Single File
A single file can contain cards for multiple different decks.

This is possible because a tag pertains to all subsequent cards in a file until any subsequent tag.

For example:
```
#flashcards/deckA
Question1 (in deckA)::Answer1
Question2 (also in deckA)::Answer2
Question3 (also in deckA)::Answer3

#flashcards/deckB
Question4 (in deckB)::Answer4
Question5 (also in deckB)::Answer5

#flashcards/deckC
Question6 (in deckC)::Answer6
A Single Card Within Multiple Decks¶
Usually the content of a card is only relevant to a single deck. However, sometimes content doesn't fall neatly into a single deck of the hierarchy.

In these cases, a card can be tagged as being part of multiple decks. The following card is specified as being in the three different decks listed.

#flashcards/language/words #flashcards/trivia #flashcards/learned-from-tv
A group of cats is called a::clowder
Note that as shown in the above example, all tags must be placed on the same line, separated by spaces.

```

## Question Specific Tags

A tag that is present at the start of the first line of a card is "question specific", and applies only to that card.

For example:
```
#flashcards/deckA
Question1 (in deckA)::Answer1
Question2 (also in deckA)::Answer2
Question3 (also in deckA)::Answer3

#flashcards/deckB Question4 (in deckB)::Answer4

Question6 (in deckA)::Answer6
Here Question6 will be part of deckA and not deckB as deckB is specific to Question4 only.

```
## Using Folder Structure

The plugin will automatically search for folders that contain flashcards & use their paths to create decks & sub-decks i.e. Folder/sub-folder/sub-sub-folder ⇔ Deck/sub-deck/sub-sub-deck.

This is an alternative to the tagging option and can be enabled in settings.

## Reviewing

Once done creating cards, click on the flashcards button on the left ribbon to start reviewing the flashcards. After a card is reviewed, a HTML comment is added containing the next review day, the interval, and the card's ease.

<!--SR:!2021-08-20,13,290-->
Wrapping in a HTML comment makes the scheduling information not visible in the notes preview. For single-line cards, you can choose whether you want the HTML comment on the same line or on a separate line in the settings. Putting them on the same line prevents breaking of list structures in the preview or after auto-formatting.

Note that you can skip a card by simply pressing S (case doesn't matter).

Tip

If you're experiencing issues with the size of the modal on mobile devices, go to settings and set the Flashcard Height Percentage and Flashcard Width Percentage to 100% to maximize it.

Faster Review
To review faster, use the following keyboard shortcuts:

Space/Enter => Show answer
0 => Reset card's progress (Sorta like Again in Anki)
1 => Review as Hard
2 or Space => Review as Good
3 => Review as Easy
Context
If the parent note has heading(s), the flashcard will have a title containing the context.

Taking the following note:

#flashcards

# Trivia

## Capitals

### Africa

Kenya::Nairobi

### North America

Canada::Ottawa
The flashcard for Kenya::Nairobi will have Trivia > Capitals > Africa as the context/title whereas the flashcard for Canada::Ottawa will have Trivia > Capitals > North America as the context/title.

## Deleting cards
To delete a card, simply delete the scheduling information & the card text.

## Ignoring cards
You can wrap flashcards in HTML comments e.g. <!--Card text <!--SR:2021-08-20,13,290--> --> to prevent it from showing up in your review queues. You can always remove the wrapping comment later.
