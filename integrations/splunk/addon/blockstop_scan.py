#!/usr/bin/env python
"""
BlockStop Splunk Input Script
Collects scan events from BlockStop API and ingests to Splunk
"""

import json
import sys
import time
import logging
import requests
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class BlockStopScanner:
    """Fetches scan events from BlockStop API"""

    def __init__(self, api_url, api_key, check_interval=300):
        self.api_url = api_url
        self.api_key = api_key
        self.check_interval = check_interval
        self.last_check = None
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })

    def get_recent_scans(self, limit=100):
        """Fetch recent scans from BlockStop API"""
        try:
            url = f"{self.api_url}/api/scans"
            params = {
                'limit': limit,
                'status': 'completed',
                'sort': 'timestamp:desc'
            }

            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()

            scans = response.json().get('scans', [])
            logger.info(f"Retrieved {len(scans)} scans from BlockStop API")
            return scans

        except requests.RequestException as e:
            logger.error(f"Failed to fetch scans: {e}")
            return []

    def format_event(self, scan):
        """Format scan data as Splunk event"""
        event = {
            'timestamp': scan.get('timestamp', int(time.time())),
            'scanId': scan.get('id'),
            'fileName': scan.get('fileName'),
            'fileSize': scan.get('fileSize', 0),
            'filePath': scan.get('filePath'),
            'malwareDetected': scan.get('malwareDetected', False),
            'riskScore': scan.get('riskScore', 0),
            'threats': scan.get('threats', []),
            'status': scan.get('status'),
            'duration': scan.get('duration', 0),
            'source': 'blockstop-api',
            'sourcetype': 'blockstop:scan'
        }
        return event

    def run(self):
        """Main loop to continuously fetch and emit events"""
        logger.info("BlockStop Splunk Input started")

        while True:
            try:
                scans = self.get_recent_scans()

                for scan in scans:
                    event = self.format_event(scan)
                    # Output event in Splunk format
                    print(json.dumps(event))
                    sys.stdout.flush()

                # Wait before next check
                time.sleep(self.check_interval)

            except KeyboardInterrupt:
                logger.info("BlockStop Splunk Input stopped")
                sys.exit(0)
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                time.sleep(60)


def main():
    """Entry point"""
    api_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
    api_key = sys.argv[2] if len(sys.argv) > 2 else ""
    check_interval = int(sys.argv[3]) if len(sys.argv) > 3 else 300

    if not api_key:
        logger.error("API key not provided")
        sys.exit(1)

    scanner = BlockStopScanner(api_url, api_key, check_interval)
    scanner.run()


if __name__ == '__main__':
    main()
