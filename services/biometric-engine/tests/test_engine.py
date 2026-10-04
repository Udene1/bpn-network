import base64
from fastapi.testclient import TestClient
from app import app

def test_health_contract():
    response = TestClient(app).get('/health')
    assert response.status_code == 200
    body = response.json()
    assert body['service'] == 'bpn-biometric-engine'
    assert body['provider'] == 'bpn-afis'
    assert body['liveness'] == 'UNIMPLEMENTED'

def test_invalid_image_is_rejected():
    response = TestClient(app).post('/v1/enroll', json={'user_id':'test-user','image_base64':base64.b64encode(b'not-a-fingerprint').decode(),'image_mime':'image/png'})
    assert response.status_code in (400, 422)
