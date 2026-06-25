# Google Sheet Vote Setup

This site can store votes in this Google Sheet:

https://docs.google.com/spreadsheets/d/1vWWUqkP_3Fe8wM9vHG484psDfs-ElGeEqZ6y2ipDwvA/edit

## 1. Add the Apps Script

1. Open the Google Sheet.
2. Go to **Extensions** -> **Apps Script**.
3. Replace the default code with the contents of `google-apps-script/Code.gs`.
4. Save the project.

## 2. Deploy it

1. Click **Deploy** -> **New deployment**.
2. Choose type **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**.
5. Click **Deploy**.
6. Copy the **Web app URL**.

## 3. Connect the website

In `script.js`, replace:

```js
const voteEndpoint = "";
```

with:

```js
const voteEndpoint = "YOUR_WEB_APP_URL";
```

Then commit and push the update to GitHub.

## Sheet Format

The Apps Script creates or uses a sheet tab named `Votes` with these columns:

```text
Name | Venue | Created At | Updated At
```

If the same person votes again with the same name, their vote is updated instead
of duplicated.
