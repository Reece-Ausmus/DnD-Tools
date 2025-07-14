- account updates
- add public/private to characters/campaigns
- add view character
- request to join campaign
- sort results in report table
- add initialization script and update readme instructions
- show message when login fails

MAP SECTION:

- dance time spinning sphere
- ability to import/export map
- select size of marker to place based on character size or enemy size selection
- BIG MARKER

# BUGS TO FIX:

- ctrl z event doesnt emit change to socket

- idea for how to solve map initialization when joining room as player:

  - have separate useEffect() that only has `socket` in the dependency array not campaigns

- write tests that check if builds succeed and work
- write daily build script on server
- come up with plan on github for branching separating prod and dev
