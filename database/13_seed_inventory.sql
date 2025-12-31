-- =====================================================
-- Seed Inventory (NUTECH Edition) - Idempotent
-- Populates 5 Labs with realistic equipment
-- Uses ON CONFLICT to prevent "Duplicate Key" errors
-- =====================================================

DO $$
DECLARE
    v_robo_id UUID;
    v_dld_id UUID;
    v_iot_id UUID;
    v_emb_id UUID;
    v_cnet_id UUID;
BEGIN
    -- Get Lab IDs
    SELECT id INTO v_robo_id FROM public.labs WHERE code = 'ROBO';
    SELECT id INTO v_dld_id FROM public.labs WHERE code = 'DLD';
    SELECT id INTO v_iot_id FROM public.labs WHERE code = 'IOT';
    SELECT id INTO v_emb_id FROM public.labs WHERE code = 'EMB';
    SELECT id INTO v_cnet_id FROM public.labs WHERE code = 'CNET';

    -- 1. ROBOTIC LAB (ROBO)
    INSERT INTO public.inventory (lab_id, name, model, asset_tag, price, supplier, maintenance_interval_days) VALUES
    (v_robo_id, 'Dobot Magician', 'Lite', 'ROBO-001', 150000, 'Edutech', 180),
    (v_robo_id, 'Dobot Magician', 'Lite', 'ROBO-002', 150000, 'Edutech', 180),
    (v_robo_id, 'KUKA Educational Robot', 'KR-3', 'ROBO-003', 2500000, 'Industrial Automation', 365),
    (v_robo_id, 'Arduino Robot Cars', 'V2.0', 'ROBO-004', 15000, 'Local Market', 90),
    (v_robo_id, 'Arduino Robot Cars', 'V2.0', 'ROBO-005', 15000, 'Local Market', 90),
    (v_robo_id, 'Arduino Robot Cars', 'V2.0', 'ROBO-006', 15000, 'Local Market', 90),
    (v_robo_id, 'LiDAR Sensor', 'RPLidar A1', 'ROBO-007', 25000, 'RoboPak', 180),
    (v_robo_id, 'Servo Motor High Torque', 'MG996R', 'ROBO-008', 1200, 'RoboPak', 30),
    (v_robo_id, 'Servo Motor High Torque', 'MG996R', 'ROBO-009', 1200, 'RoboPak', 30),
    (v_robo_id, 'Humanoid Robot Kit', 'Bioloid', 'ROBO-010', 85000, 'Robotis', 180),
    (v_robo_id, 'Drone Kit (Programmable)', 'DJI Tello', 'ROBO-011', 35000, 'DJI', 90),
    (v_robo_id, 'Drone Kit (Programmable)', 'DJI Tello', 'ROBO-012', 35000, 'DJI', 90),
    (v_robo_id, 'Soldering Station', 'Hakko FX-888D', 'ROBO-013', 25000, 'ToolShop', 365),
    (v_robo_id, '3D Printer', 'Ender 3 V2', 'ROBO-014', 65000, 'Creality', 90),
    (v_robo_id, '3D Printer', 'Ender 3 V2', 'ROBO-015', 65000, 'Creality', 90)
    ON CONFLICT (asset_tag) DO NOTHING;

    -- 2. DLD LAB
    INSERT INTO public.inventory (lab_id, name, model, asset_tag, price, supplier, maintenance_interval_days) VALUES
    (v_dld_id, 'Digital Logic Trainer', 'KL-300', 'DLD-001', 45000, 'K&H', 365),
    (v_dld_id, 'Digital Logic Trainer', 'KL-300', 'DLD-002', 45000, 'K&H', 365),
    (v_dld_id, 'Digital Logic Trainer', 'KL-300', 'DLD-003', 45000, 'K&H', 365),
    (v_dld_id, 'Digital Logic Trainer', 'KL-300', 'DLD-004', 45000, 'K&H', 365),
    (v_dld_id, 'Oscilloscope', 'Rigol DS1054Z', 'DLD-005', 85000, 'Rigol', 180),
    (v_dld_id, 'Oscilloscope', 'Rigol DS1054Z', 'DLD-006', 85000, 'Rigol', 180),
    (v_dld_id, 'Function Generator', 'Uni-T UTG9005C', 'DLD-007', 25000, 'Uni-T', 180),
    (v_dld_id, 'Function Generator', 'Uni-T UTG9005C', 'DLD-008', 25000, 'Uni-T', 180),
    (v_dld_id, 'Digital Multimeter', 'Fluke 17B+', 'DLD-009', 15000, 'Fluke', 180),
    (v_dld_id, 'Digital Multimeter', 'Fluke 17B+', 'DLD-010', 15000, 'Fluke', 180),
    (v_dld_id, 'Logic Probe', 'LP-1', 'DLD-011', 1500, 'Local', 365),
    (v_dld_id, 'Breadboard Layout', 'Large', 'DLD-012', 2000, 'Local', 0),
    (v_dld_id, 'Breadboard Layout', 'Large', 'DLD-013', 2000, 'Local', 0),
    (v_dld_id, 'Power Supply (DC)', 'Gophert 30V 5A', 'DLD-014', 12000, 'Gophert', 365),
    (v_dld_id, 'FPGA Board', 'Basys 3', 'DLD-015', 55000, 'Digilent', 365)
    ON CONFLICT (asset_tag) DO NOTHING;

    -- 3. IOT LAB
    INSERT INTO public.inventory (lab_id, name, model, asset_tag, price, supplier, maintenance_interval_days) VALUES
    (v_iot_id, 'Raspberry Pi 4', 'Model B 4GB', 'IOT-001', 18000, 'Element14', 180),
    (v_iot_id, 'Raspberry Pi 4', 'Model B 4GB', 'IOT-002', 18000, 'Element14', 180),
    (v_iot_id, 'Raspberry Pi 4', 'Model B 4GB', 'IOT-003', 18000, 'Element14', 180),
    (v_iot_id, 'ESP32 Dev Kit', 'DOIT V1', 'IOT-004', 1500, 'AliExpress', 0),
    (v_iot_id, 'ESP32 Dev Kit', 'DOIT V1', 'IOT-005', 1500, 'AliExpress', 0),
    (v_iot_id, 'ESP32 Dev Kit', 'DOIT V1', 'IOT-006', 1500, 'AliExpress', 0),
    (v_iot_id, 'ESP8266 NodeMCU', 'V3', 'IOT-007', 800, 'Local', 0),
    (v_iot_id, 'ESP8266 NodeMCU', 'V3', 'IOT-008', 800, 'Local', 0),
    (v_iot_id, 'LoRa Module', 'SX1278', 'IOT-009', 2500, 'HopeRF', 0),
    (v_iot_id, 'LoRa Module', 'SX1278', 'IOT-010', 2500, 'HopeRF', 0),
    (v_iot_id, 'Zigbee Module', 'XBee S2C', 'IOT-011', 5000, 'Digi', 0),
    (v_iot_id, 'IoT Gateway', 'Dragino', 'IOT-012', 45000, 'Dragino', 365),
    (v_iot_id, 'DHT22 Sensor', 'Temperature/Humidity', 'IOT-013', 800, 'Local', 0),
    (v_iot_id, 'Ultrasonic Sensor', 'HC-SR04', 'IOT-014', 200, 'Local', 0),
    (v_iot_id, 'Relay Module', '4-Channel', 'IOT-015', 1200, 'Local', 0)
    ON CONFLICT (asset_tag) DO NOTHING;

    -- 4. EMBEDDED LAB
    INSERT INTO public.inventory (lab_id, name, model, asset_tag, price, supplier, maintenance_interval_days) VALUES
    (v_emb_id, 'FPGA Development Board', 'Zybo Z7-20', 'EMB-001', 95000, 'Digilent', 365),
    (v_emb_id, 'FPGA Development Board', 'Zybo Z7-20', 'EMB-002', 95000, 'Digilent', 365),
    (v_emb_id, 'STM32 Discovery', 'F4', 'EMB-003', 8500, 'STMicro', 365),
    (v_emb_id, 'STM32 Discovery', 'F4', 'EMB-004', 8500, 'STMicro', 365),
    (v_emb_id, 'PIC Microcontroller Kit', 'EasyPIC v7', 'EMB-005', 45000, 'MikroE', 365),
    (v_emb_id, 'Tiva C Launchpad', 'TM4C123G', 'EMB-006', 6000, 'Texas Instruments', 365),
    (v_emb_id, 'Tiva C Launchpad', 'TM4C123G', 'EMB-007', 6000, 'Texas Instruments', 365),
    (v_emb_id, 'Oscilloscope (Digital)', 'Tektronix TBS1052B', 'EMB-008', 120000, 'Tektronix', 180),
    (v_emb_id, 'Logic Analyzer', 'Saleae 8ch', 'EMB-009', 25000, 'Saleae', 365),
    (v_emb_id, 'Universal Programmer', 'TL866II', 'EMB-010', 12000, 'XGecu', 365),
    (v_emb_id, 'AVR Trainer', 'ATmega32', 'EMB-011', 25000, 'Local', 365),
    (v_emb_id, 'Soldering Microscope', 'Andonstar', 'EMB-012', 35000, 'Andonstar', 365),
    (v_emb_id, 'SMD Rework Station', 'Quick 861DW', 'EMB-013', 55000, 'Quick', 365),
    (v_emb_id, 'DC Power Supply', 'Variable 0-60V', 'EMB-014', 35000, 'Uni-T', 365),
    (v_emb_id, 'Evaluation Board', 'NVIDIA Jetson Nano', 'EMB-015', 55000, 'NVIDIA', 180)
    ON CONFLICT (asset_tag) DO NOTHING;

    -- 5. CNET LAB
    INSERT INTO public.inventory (lab_id, name, model, asset_tag, price, supplier, maintenance_interval_days) VALUES
    (v_cnet_id, 'High-End Workstation', 'Dell Precision', 'CNET-001', 350000, 'Dell', 180),
    (v_cnet_id, 'High-End Workstation', 'Dell Precision', 'CNET-002', 350000, 'Dell', 180),
    (v_cnet_id, 'High-End Workstation', 'Dell Precision', 'CNET-003', 350000, 'Dell', 180),
    (v_cnet_id, 'High-End Workstation', 'Dell Precision', 'CNET-004', 350000, 'Dell', 180),
    (v_cnet_id, 'Cisco Router', '2900 Series', 'CNET-005', 120000, 'Cisco', 365),
    (v_cnet_id, 'Cisco Router', '2900 Series', 'CNET-006', 120000, 'Cisco', 365),
    (v_cnet_id, 'Cisco Switch', 'Catalyst 2960', 'CNET-007', 85000, 'Cisco', 365),
    (v_cnet_id, 'Cisco Switch', 'Catalyst 2960', 'CNET-008', 85000, 'Cisco', 365),
    (v_cnet_id, 'Firewall Appliance', 'Fortinet 60F', 'CNET-009', 150000, 'Fortinet', 365),
    (v_cnet_id, 'Server Rack', '42U', 'CNET-010', 85000, 'Local', 0),
    (v_cnet_id, 'Crimping Tool', 'RJ45 Professional', 'CNET-011', 3500, 'Klein Tools', 0),
    (v_cnet_id, 'Cable Tester', 'Fluke LinkRunner', 'CNET-012', 150000, 'Fluke', 365),
    (v_cnet_id, 'Access Point', 'Ubiquiti Unifi', 'CNET-013', 35000, 'Ubiquiti', 180),
    (v_cnet_id, 'Network Cable Roll', 'Cat6 305m', 'CNET-014', 25000, 'Clipsal', 0),
    (v_cnet_id, 'Patch Panel', '24 Port', 'CNET-015', 8500, 'D-Link', 0)
    ON CONFLICT (asset_tag) DO NOTHING;

    RAISE NOTICE 'Inventory Seeding Complete: 75 items added.';
END $$;
