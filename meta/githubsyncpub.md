# github password at web

aljrf papaetc

No two factor authentication. If enabled, iphone is needed, and github mobile app.


# gpg setup

Use seahorse gpg manager, add gpgkey.

Uppercase p--> somepass for pass at seahorse

Export public key using hamburger menu as Javierdocumentedpub.asc

It has the format ----begin pgp public key block----

aljrf@newdelly:~/projects/projects$ gpg --list-keys
/home/aljrf/.gnupg/pubring.kbx
------------------------------
pub   rsa4096 2022-07-02 [SC]
      1570676F22C5EC01
uid           [ultimate] Javier (This is documented) <javier.rodriguez.frias@gmail.com>
sub   rsa4096 2022-07-02 [E]

aljrf@newdelly:~/projects/projects$ pass init 1570676F22C
Password store initialized for 1570676F22C5

git pull is now successful

# github setup

Add the key in github, under settings--> ssh and gpg keys--> new gpg key

Name it documented, paste pgp block from terminal after 

cat Javierdocumentedpub.asc

## inside obsidian

ctrl p git commit all changes with specific message
ctrl p git push

