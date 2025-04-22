# Dockstarter NAS

1. Install raspian (headless)
2. Issue commands:

```
sudo apt-get update
sudo apt-get dist-upgrade
sudo apt-get install curl git
bash -c "$(curl -fsSL https://get.docker.com)"
bash -c "$(curl -fsSL https://get.dockstarter.com)"
sudo reboot

```
3. Then guess where the external disks are using
```
sudo fdisk -l

/dev/mmcblk0p1        8192   532479   524288  256M  c W95 FAT32 (LBA)
/dev/mmcblk0p2      532480 62333951 61801472 29.5G 83 Linux

```
    in this case /dev/mmcblk0p2 is the external 500GB drive




1.  Then configure dockstarter issuing the command:
```
ds

```
