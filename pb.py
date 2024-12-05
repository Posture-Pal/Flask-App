from pubnub.pnconfiguration import PNConfiguration
from pubnub.pubnub import PubNub
from pubnub.models.consumer.access_manager import PNAccessManagerTokenResult
import time

# PubNub configuration
pnconfig = PNConfiguration()
pnconfig.subscribe_key = "sub-c-90478427-a073-49bc-b402-ba4903894284"
pnconfig.publish_key = "pub-c-ef699d1a-d6bd-415f-bb21-a5942c7afc1a"
pnconfig.secret_key = "sec-c-MjVhNWM4MmItMWM1Yy00N2Y1LWIwMzItNTA1MzUzNDQ5NzFi" 
pubnub = PubNub(pnconfig)

def generate_token(user_id, ttl=5):
    try:
        permissions = {
            "resources": {
                "channels": {"Posture-Pal": {"read": True, "write": True}}
            },
            "patterns": {},
            "meta": {"user_id": user_id},
            "ttl": ttl
        }
        token_result = pubnub.grant_token(permissions)
        return token_result.result['token']
    except Exception as e:
        print(f"Error generating token: {e}")
        return None
    
def parse_token(token):
    try:
        parsed = pubnub.parse_token(token)
        return parsed
    except Exception as e:
        print(f"Error parsing token: {e}")
        return None