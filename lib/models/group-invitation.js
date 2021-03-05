"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("../model");
const user_1 = require("./user");
const group_membership_1 = require("./group-membership");
const helpers_1 = require("../helpers");
class GroupInvitation extends model_1.default {
    static async makeInvitation(username, userGroup) {
        const user = new user_1.default({ _id: username });
        await user.fetch({ decrypt: false });
        const { publicKey } = user.attrs;
        const invitation = new this({
            userGroupId: userGroup._id,
            signingKeyPrivateKey: userGroup.privateKey,
            signingKeyId: userGroup.attrs.signingKeyId,
        });
        invitation.userPublicKey = publicKey;
        await invitation.save();
        return invitation;
    }
    async activate() {
        const { userGroups } = helpers_1.userGroupKeys();
        const groupId = this.attrs.userGroupId;
        if (userGroups[groupId]) {
            return true;
        }
        const groupMembership = new group_membership_1.default({
            userGroupId: this.attrs.userGroupId,
            username: helpers_1.loadUserData().username,
            signingKeyPrivateKey: this.attrs.signingKeyPrivateKey,
            signingKeyId: this.attrs.signingKeyId,
        });
        await groupMembership.save();
        await group_membership_1.default.cacheKeys();
        return groupMembership;
    }
    async encryptionPublicKey() {
        return this.userPublicKey;
    }
    encryptionPrivateKey() {
        return helpers_1.loadUserData().appPrivateKey;
    }
}
exports.default = GroupInvitation;
GroupInvitation.className = 'GroupInvitation';
GroupInvitation.schema = {
    userGroupId: String,
    signingKeyPrivateKey: String,
    signingKeyId: String,
};
GroupInvitation.defaults = {
    updatable: false,
};
