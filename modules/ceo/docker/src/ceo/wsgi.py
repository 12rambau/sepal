from ceo import app

def build_app(gmaps_api_key='', digital_globe_api_key='', dgcs_connect_id='', planet_api_key='', sepal_host='', ee_account='', ee_key_path=''):

    app.config['GMAPS_API_KEY'] = gmaps_api_key
    app.config['DIGITALGLOBE_API_KEY'] = digital_globe_api_key
    app.config['DGCS_CONNECT_ID'] = dgcs_connect_id
    app.config['PLANET_API_KEY'] = planet_api_key
    app.config['SEPAL_HOST'] = sepal_host

    app.config['EE_ACCOUNT'] = ee_account
    app.config['EE_KEY_PATH'] = ee_key_path
    app.config['EE_TOKEN_ENABLED'] = True


    try:
        from gee_gateway import gee_gateway, gee_initialize
        gee_initialize(ee_account=ee_account, ee_key_path=ee_key_path)
        app.register_blueprint(gee_gateway, url_prefix='/' + app.config['GEEG_API_URL'])
    except ImportError as e:
        pass

    return app