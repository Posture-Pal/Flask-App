from pubnub.pnconfiguration import PNConfiguration
from pubnub.pubnub import PubNub
from pubnub.models.consumer.access_manager import PNAccessManagerAuditResult
from pubnub.models.consumer.v3.channel import Channel
from pubnub.models.consumer.v3.group import Group
from pubnub.models.consumer.v3.uuid import UUID
import time

# PubNub configuration
def initialize_pubnub(uuid):
    if not uuid:
        raise ValueError("UUID cannot be empty or None.")
    
    pnconfig = PNConfiguration()
    pnconfig.subscribe_key = "sub-c-90478427-a073-49bc-b402-ba4903894284"
    pnconfig.publish_key = "pub-c-ef699d1a-d6bd-415f-bb21-a5942c7afc1a"
    pnconfig.secret_key = "sec-c-MjVhNWM4MmItMWM1Yy00N2Y1LWIwMzItNTA1MzUzNDQ5NzFi"
    pnconfig.uuid = uuid
    return PubNub(pnconfig)

    
def generate_token(user_id, ttl=5):
    try:
        pubnub = initialize_pubnub(user_id)
        
        print(f"Granting token for user_id: {user_id}")
        
        envelope = pubnub.grant_token() \
            .channels([Channel.id("Posture-Pal").read().write()]) \
            .authorized_uuid(user_id) \
            .ttl(ttl) \
            .sync() 
        
        token = envelope.result.token 
        print(token)
        return token
    except Exception as e:
        print(f"Error generating token: {e}")
        return None

def parse_token(token, user_id):
    try:
        print("Parsing the TOKEN")

        pubnub = initialize_pubnub(user_id)

        token_details = pubnub.parse_token(token)
        
        read_access = token_details.resources.channels["Posture-Pal"]["read"]
        write_access = token_details.resources.channels["Posture-Pal"]["write"]
        uuid = token_details.authorized_uuid
        ttl = token_details.ttl
        timestamp = token_details.timestamp

        print(f"Token Details: UUID={uuid}, TTL={ttl}, Timestamp={timestamp}")
        print(f"Read Access: {read_access}, Write Access: {write_access}")
        
        return timestamp, ttl, uuid, read_access, write_access
    except Exception as e:
        print(f"Error parsing token: {e}")
        return None
    
def refresh_token(user_id, ttl=5):
    try:
        new_token = generate_token(user_id, ttl=ttl)
        if new_token:
            print(f"Token refreshed successfully for user: {user_id}")
        else:
            print(f"Failed to refresh token for user: {user_id}")
        return new_token
    except Exception as e:
        print(f"Error in refresh_token: {e}")
        return None