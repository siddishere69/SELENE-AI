from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/calendar')
def get_calendar():
    # Simulated red-folder events
    events = [
        {"date": "2025-05-14", "time": "18:00", "country": "United States", "event": "FOMC Interest Rate Decision"},
        {"date": "2025-05-15", "time": "14:30", "country": "United States", "event": "CPI YoY"},
        {"date": "2025-05-16", "time": "12:00", "country": "Eurozone", "event": "ECB Press Conference"},
        {"date": "2025-05-17", "time": "15:00", "country": "United Kingdom", "event": "BoE Rate Statement"},
        {"date": "2025-05-18", "time": "20:00", "country": "Japan", "event": "BoJ Outlook Report"},
    ]
    return jsonify({"events": events})

if __name__ == '__main__':
    app.run(port=5050)
