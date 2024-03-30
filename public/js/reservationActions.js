// reservationActions.js
function submitReservation(reservationsid) {
    $.ajax({
        url: '/submit-reservation',
        method: 'POST',
        data: { reservationsid: reservationsid },
        success: function(response) {
            alert('Reservation submitted successfully.');
            location.reload();
        },
        error: function() {
            alert('Error submitting reservation.');
        }
    });
}

function cancelReservation() {
    window.location.href = '/booking'; 
}
