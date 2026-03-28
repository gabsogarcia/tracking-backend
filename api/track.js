// tempo

let start = Date.now();

setInterval(() => {
  fetch("/api/track", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      uid,
      event: "time",
      value: Math.floor((Date.now() - start)/1000)
    })
  });
}, 10000);

//scroll

let maxScroll = 0;

window.addEventListener("scroll", () => {
  const scroll = window.scrollY;
  if (scroll > maxScroll) {
    maxScroll = scroll;

    fetch("/api/track", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        uid,
        event: "scroll",
        value: maxScroll
      })
    });
  }
});

