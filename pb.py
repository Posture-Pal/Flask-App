from pubnub.pnconfiguration import PNConfiguration
from pubnub.pubnub import PubNub
from pubnub.models.consumer.v3.channel import Channel



# cipher_key = config.get("PUBNUB_CIPHER_KEY")
pn_config = PNConfiguration()
pn_config.publish_key = 'pub-c-ef699d1a-d6bd-415f-bb21-a5942c7afc1a'
pn_config.subscribe_key = 'sub-c-90478427-a073-49bc-b402-ba4903894284'
pn_config.uuid = "113667953823888935649"
pn_config.secret_key = "token_not_valid"
# pn_config.cipher_key = 'secret_123'
pubnub = PubNub(pn_config)
pi_channel = "Posture-Pal"

def grant_read_access(user_id):
    envelope = pubnub.grant_token() \
    .channels([Channel.id(channel).read() for channel in (pi_channel)]) \
    .authorized_uuid(user_id) \
    .ttl(60) \
    .sync()
    return envelope.result.token
    
def grant_write_access(user_id):
    envelope = pubnub.grant_token() \
    .channels([Channel.id(channel).write() for channel in (pi_channel)]) \
    .authorized_uuid(user_id) \
    .ttl(60) \
    .sync()
    return envelope.result.token

def grant_read_and_write_access(user_id):
    print(f"GRANTING READ AND WRITE ACCESS {user_id} ")
    envelope = pubnub.grant_token() \
     .channels([Channel.id("Posture-Pal").read().write()])\
    .authorized_uuid(user_id) \
    .ttl(60) \
    .sync()
    print("Inside grant_read_and_write_access ",envelope.result.token)
    return envelope.result.token

def revoke_access(token):
    envelope = pubnub.revoke_token(token)


def parse_token(token):
    global pubnub
    print("Printing the token ", token)
    try:
        token_details = pubnub.parse_token(token)
        print("Printing the token details: ", token_details)
    except Exception as e:
        print(f"Error parsing token: {e}")
        raise
    read_access = token_details["resources"]["channels"]["Posture-Pal"]["read"]
    write_access = token_details["resources"]["channels"]["Posture-Pal"]["write"]
    uuid = token_details['authorized_uuid']
    return token_details['timestamp'], token_details["ttl"], uuid, read_access, write_access
