# === calendar_api.py ===
from flask import Flask, jsonify
import investpy
import datetime

app = Flask(__name__)

@app.route('/events')
def get_upcoming_events():
    try:
        today = datetime.date.today()
        tomorrow = today + datetime.timedelta(days=1)

        events = investpy.economic_calendar(
            from_date=today.strftime('%d/%m/%Y'),
            to_date=tomorrow.strftime('%d/%m/%Y')
        )

        top_events = events[['country', 'event', 'date', 'time', 'currency', 'importance']].head(5)

        result = []
        for _, row in top_events.iterrows():
            result.append({
                "country": row['country'],
                "event": row['event'],
                "date": row['date'],
                "time": row['time'],
                "currency": row['currency'],
                "importance": row['importance']
            })

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5050)
