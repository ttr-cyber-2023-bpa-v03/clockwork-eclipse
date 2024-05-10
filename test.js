const username = "nicholas";
const select = [ "coins", "crystals" ];

const result = $.ajax({
    type: "GET",
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    url: `/api/users/${username}/?select=${select.join(",")}`,
});

console.log(result); // -> { "coins": 0, "crystals": 0 }