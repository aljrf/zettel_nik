o#pihole
## end of install message
If you have not done so already, the above IP should be set to static. View the web interface at  
http://pi.hole/admin or http://192.168.1.20/admin  
  
Your Admin Webpage login password is vlHoMNFn  
user:admin palabra:  
vlHoMNFn
# pihole creation
  
1.- Set Pihole IP to static  
2.- Setup DHCP ON for pi-hole and OFF for router  

Every IP will be given out by pihole, and they will take care of blocking


# If FTL is not starting
sudo rm /etc/dnsmasq.d/SoftAp0  
sudo touch /etc/dnsmasq.d/.SoftAp0  
  
.SoftAp0 prevents recreation of SoftAp0  
sudo service pihole-FTL start

# log2ram to avoid emmc deteriration:  
echo "deb [http://packages.azlux.fr/debian/](http://packages.azlux.fr/debian/) bullseye main" | sudo tee /etc/apt/sources.list.d/azlux.list  
wget -qO - [https://azlux.fr/repo.gpg.key](https://azlux.fr/repo.gpg.key) | sudo apt-key add -  
sudo apt update  
sudo apt install log2ram

# clone emmc  
  
$ sudo /opt/scripts/tools/eMMC/beaglebone-black-make-microSD-flasher-from-eMMC.sh  
1. Edit uEnv.txt File.  
After your machine automatically mounts the Micro SD card, in your file manager, most Linux operating systems you can simply right click in the white space and click open terminal here, otherwise you will need to note the location in the address bar and open a terminal and navigate to that location manually. aether way you should have a terminal open and be in the root of your Micro SD for this command will require you to have root privileges and will not work if you try to use a simple text editor, In the terminal use this command to open the uEnv.txt file so you can edit it with root privileges.  
  
$ sudo nano boot/uEnv.txt  
  
Now scroll down to the bottom of the text file and you will see the last two lines are uncommented.  
  
uuid=29623e45-3bfe-254a-a742-aa25d1c43cf6  
cmdline=init=/opt/scripts/tools/eMMC/init-eMMC-flasher-v3.sh  
  
You will need to comment out the line containing ‘uuid=’ with a ‘#’ symbol like the ones above. so you should have something like this  
  
#uuid=29626e45-6bfe-452a-a742-aa25d1c43bf6  
cmdline=init=/opt/scripts/tools/eMMC/init-eMMC-flasher-v3.sh  
  
Now you need to save and close the file, use (CTRL-o to save) and CTRL-x) to closes nano. remove the Micro SD card from the adapter.  
  
2. Insert Micro SD Into BeagleBone Black.  
Now after inserting your Micro SD card into your device you can power it up, watching the user LED’s you will notice them dancing a bit then they will go into cylon mode, this means your eMMC is being accessed and the restoration is in process. After the process is complete your BeagleBone Black will power down automatically, make sure to remove the Micro SD card before restarting your device.