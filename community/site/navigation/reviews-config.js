// Where the page reads visitor reviews and merchants' offers (S9; D25: reviews live in a Google Sheet).
// Each list is a tab of one Sheet, published to the web as CSV; each is filled by a Google Form. Only rows a moderator
// has ticked as approved show on the page. Leave a URL empty to switch that part off. Setup: sheets/README.md.
window.NAV_SHEETS = {
  reviewsCsv: '',        // the "reviews" tab, published as CSV (…/pub?gid=…&single=true&output=csv)
  reviewForm: '',        // the review form's link (…/viewform)
  reviewFormStall: '',   // the form's "Stall" question as entry.<number>, so the link from a card fills it in
  offersCsv: '',         // the "offers" tab, published as CSV
  offerForm: '',         // the form merchants use to post an offer
  offerFormStall: '',
};
