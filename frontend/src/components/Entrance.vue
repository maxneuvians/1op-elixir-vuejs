<template>
  <div class="entrance">
    <br />
    <form v-on:submit.prevent="submitEntranceRequest($event.target)">
      <fieldset>
        <span v-if="!room_id">
          <label for="r">Your desired room id ( 1op.eu/... )</label>
          <input :disabled="!allowEntranceSubmit" name="roomIdField" id="r" type="text" placeholder="room id, eg. asdasdasd">
        </span>

        <label for="p">Your secret password (it will get lost if you refresh the site*)</label>
        <input :disabled="!allowEntranceSubmit" name="passwordField" id="p" type="password" placeholder="Enter your password..."/>
        <small> * - so don't hit refresh after entering the chatroom </small>

        <center>
          <input :disabled="!allowEntranceSubmit" type="submit">
        </center>
      </fieldset>
    </form>
    <p>
    You just send a link and a password to a friend. You don't have to set up a chatroom before sending the link, so just write <em>1op.eu/your_room</em> and send it right away. If both of you have the same password, you will get connected and no one will ever see what you have been talking about. There is no limit when it comes to people connected to a chat room (they all have to know the firstly-connected user's password). You can share only text messages.
    </p>
    <h4>What the hell is this place?</h4>
    <p>
      1op is an encrypted chat application, where I try to solve a couple of trust-related problems when it comes to current instant chat apps. Let's dive deeper into how this idea is structured...
    </p>
    <h5>Alright, so what's the big deal?</h5>
    <p>
      We can pretty much encrypt stuff using either symmetric or asymmetric algorithms. With symmetric encryption we only need a key passphrase to encrypt/decrypt a message. It's all more complicated when it comes to asymmetric encryption algorithms, where we have a Private and a Public key. Using a Private key we can encrypt a message, which can be decrypted using only the Public one, and vice-versa (Public-key-encrypted messages can be decrypted using only the Private key). That's pretty much how the Internet identity trust is built. We trust that Google is Google, because its identity is encrypted using some Certificate Authority's Private Key (which is securely stored somewhere far away) and we all have its Public key stored on our computers. We could use the same solution in instant messaging in order to prevent everybody inbetween our computers from seeing our messages.
    </p>
    <p>... but why shouldn't we?</p>
    <p>
      The Internet relies on certificates, which are signed by authorities, in which indentities we all trust. In order to gain that kind of signed certificate we have to pay a price to a Certificate Authority and we won't be doing this for a simple chatroom. The only solution we have is to generate our own certificates. But we have to transfer them somehow between computers, and that is where a rogue middleman can come in to interfere. It's very easy for the middleman to fake secure connection when we rely only on an asymmetrical encryption protocol like RSA (the middleman can store our public key, generate its own key-pair and encrypt every message using its own key, and then resend a message encrypted by our own public key back to us without anyone noticing). What's the solution I would like to offer?
    </p>
    <h5>Let's encrypt public keys using symmetric encryption!</h5>
    <p>
      There is a splendid symmetric encryption protocol called AES, which we can use to encrypt our public key before sending it to our chatroom friend. AES needs a passphrase. A password, which we can tell each other using other type of communication (e.g. mobile phone). That way, we can be sure that:
    </p>
    <ol>
      <li>No one inbetween our computers can read our messages in real time (which would be impossible without signing an asymmetrical key-pair or trusting a middleman)</li>
      <li>No one can ever decrypt our messages in the future, even when they have all our web traffic secured and know our initial passphrase (thanks to an asymmetrical encryption)</li>
      <li>1op.eu is 1op.eu (thanks to a certificate signed by &quot;Let's Encrypt&quot; Certificate Authority - take a look at the green lock or <em>https://</em> in the address bar).</li>
    </ol>

    <h5>Whoa! How exactly does it work?</h5>
    <p>
    First of all you save your plain password in a browser temporarily (which will be cleared after a refresh, so don't do that). Then, you will send its SHA-512 hashsum (one-way encryption) to the server in order to compare with other chatroom members. If you are the first one or the previous guy had the same password-hashsum you will open a socket connection to the server and send your Public RSA key encrypted using AES using your password (stored temporarily in your browser). Every other chatroom client will receive your message and decrypt your RSA Public key using AES with the same password you got. From now on, you will receive messages encrypted on other clients' computers using your RSA Public key.
    </p>
    <h5>... but wait! How can i trust you?!</h5>
    <p>It's <a href="http://github.com/intpl/1op-elixir-vuejs" target="_blank">open source</a>, baby! I did it just for fun. You can read the code and set it up on your own if you are paranoid. :)</p>
    <em>Made with love by <a href="http://gladecki.pl" target="_blank">Bartek Gladecki</a></em>
  </div>
</template>

<script>
  import { mapActions, mapState } from 'vuex'

  export default {
    name: 'entrance',
    computed: mapState(['room_id', 'allowEntranceSubmit']),
    methods: {
      ...mapActions(['SUBMIT_ENTRANCE_REQUEST', 'BLOCK_SUBMIT_ENTRANCE']),

      submitEntranceRequest (target) {
        this.BLOCK_SUBMIT_ENTRANCE()
        setTimeout(() => {
          this.SUBMIT_ENTRANCE_REQUEST(target)
        }, 100)
      }
    }
  }
</script>

<style lang="scss" scoped>
  .entrance > form {
    background-color: #171717;
    border: 1px solid #444;
    padding: 20px;

    input {
      background-color: transparent;
      border-color: #444;
      color: #fff;
    }
  }
</style>
